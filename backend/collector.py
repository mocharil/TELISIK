"""Free Jetstream v2 live tail. No login, HTML scraping, or historical replay API."""
import asyncio
import json
import logging
import time
from urllib.parse import urlencode
import websockets
from .core import make_post, now, parse_time

log = logging.getLogger(__name__)
ENDPOINT = 'wss://jetstream.us-east.bsky.network/xrpc/network.bsky.jetstream.subscribeEvents'
CURSOR_KEY = 'jetstream_v2_seq'


def unpack(frame):
    body = frame.get('payload', frame)
    if not isinstance(body, dict):
        raise ValueError('Invalid envelope')
    if 'commit' in body:  # legacy fixture support; never reuse legacy cursors on v2
        return body.get('did'), body['commit'], body.get('time_us'), body.get('kind', 'commit')
    kind = body.get('$type', '').split('#')[-1] or body.get('kind', '')
    return body.get('did'), body.get('account', body) if kind == 'account' else body, body.get('seq'), kind


class Collector:
    def __init__(self, store):
        self.store, self.task = store, None
        self.last_seq = store.get(CURSOR_KEY)
        self._settings = None
        self._settings_at = 0
        self.state = dict(running=False, connected=False, received=0, accepted=0, deleted=0,
                          reconnects=0, last_event=None, error=None, started_at=None, skipped=0)

    def settings(self, refresh=False):
        if refresh or self._settings is None or time.monotonic() - self._settings_at > 5:
            self._settings = self.store.get('source_settings', dict(keywords=['jakarta','banjir','transjakarta','mrt'], languages=[], retention_days=7))
            self._settings_at = time.monotonic()
        return self._settings

    def checkpoint(self):
        if self.last_seq is not None:
            self.store.set(CURSOR_KEY, self.last_seq)

    def process(self, frame):
        if not isinstance(frame, dict):
            raise ValueError('Invalid event')
        did, commit, cursor, kind = unpack(frame)
        self.state['received'] += 1
        self.state['last_event'] = now()
        v2 = 'payload' in frame
        if v2 and isinstance(cursor, int):
            if self.last_seq is not None and cursor <= self.last_seq:
                return  # inclusive replay cannot resurrect a deleted or superseded record
        self._apply(did, commit, kind)
        if v2 and isinstance(cursor, int):
            self.last_seq = cursor

    def _apply(self, did, commit, kind):
        if not isinstance(did, str) or not did.startswith('did:') or not isinstance(commit, dict):
            return
        if kind == 'account' and commit.get('active') is False or kind == 'sync':
            self.store.delete_did(did)
            return
        if kind != 'commit' or commit.get('collection') != 'app.bsky.feed.post':
            return
        rkey = commit.get('rkey')
        if not isinstance(rkey, str) or not rkey or '/' in rkey:
            return
        uri = f'at://{did}/app.bsky.feed.post/{rkey}'
        operation = commit.get('operation')
        if operation == 'delete':
            self.store.delete(uri)
            self.state['deleted'] += 1
            return
        if operation not in ('create','update'):
            return
        record = commit.get('record')
        if not isinstance(record, dict) or not isinstance(record.get('text'), str):
            return
        created = record.get('createdAt')
        try:
            from datetime import datetime
            parsed = datetime.fromisoformat(created.replace('Z','+00:00'))
            if parsed.tzinfo is None:
                raise ValueError('Missing timezone')
        except (ValueError, AttributeError, TypeError):
            self.state['skipped'] += 1
            return
        config = self.settings()
        langs = record.get('langs', [])
        if not isinstance(langs, list) or any(not isinstance(x,str) for x in langs):
            return
        matches = (not config['keywords'] or any(k.casefold() in record['text'].casefold() for k in config['keywords'])) and (not config['languages'] or bool(set(langs) & set(config['languages'])))
        if matches:
            post = make_post(did, rkey, record)
            self.store.put(post)
            self.state['accepted'] += 1
        elif operation == 'update':
            self.store.delete(uri)

    async def maintain(self):
        while True:
            await asyncio.sleep(30)
            self.checkpoint()
            self.store.prune(self.settings()['retention_days'])

    async def run(self):
        self.state.update(running=True, error=None, started_at=now())
        maintenance = asyncio.create_task(self.maintain())
        backoff = 1
        try:
            while True:
                params = {'collections':'app.bsky.feed.post'}
                if self.last_seq is not None:
                    params['cursor'] = str(self.last_seq)
                try:
                    async with websockets.connect(f'{ENDPOINT}?{urlencode(params)}', subprotocols=['xrpc.v1.json'], max_size=2**21, ping_interval=20, ping_timeout=20, open_timeout=15, close_timeout=5) as ws:
                        self.state.update(connected=True, error=None)
                        backoff = 1
                        async for message in ws:
                            try:
                                self.process(json.loads(message))
                                if self.state['received'] % 100 == 0:
                                    self.checkpoint()
                            except (ValueError, TypeError, KeyError, AttributeError):
                                self.state['skipped'] += 1
                    self.state.update(connected=False, error='Feed closed. Reconnecting; collection may have gaps.')
                except (OSError, websockets.WebSocketException, TimeoutError):
                    self.state.update(connected=False, error='Feed unavailable. Retrying; collection may have gaps.')
                self.checkpoint()
                self.state['reconnects'] += 1
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)
        except Exception:
            self.state['error'] = 'Collector stopped. Check local logs and restart.'
            log.exception('Collector failed')
        finally:
            maintenance.cancel()
            await asyncio.gather(maintenance, return_exceptions=True)
            self.checkpoint()
            self.state.update(running=False, connected=False)

    def start(self):
        if not self.task or self.task.done():
            self.state.update(running=True, error=None)
            self.task = asyncio.create_task(self.run())

    async def stop(self):
        if self.task and not self.task.done():
            self.task.cancel()
            await asyncio.gather(self.task, return_exceptions=True)
        self.checkpoint()
        self.state.update(running=False, connected=False)

import importlib
import json

import pytest
from fastapi.testclient import TestClient

from backend.collector import Collector
from backend.core import Store, analyse, make_post, seed_demo, simulate


@pytest.fixture
def store(tmp_path):
    return Store(tmp_path / 'test.sqlite')


def event(operation='create', text='Banjir Jakarta, periksa sumber resmi.', rkey='one'):
    return {'did': 'did:plc:test', 'kind': 'commit', 'time_us': 1234567, 'commit': {'operation': operation, 'collection': 'app.bsky.feed.post', 'rkey': rkey, 'record': {'text': text, 'createdAt': '2026-01-01T00:00:00Z', 'langs': ['id']}}}


def test_demo_is_idempotent_and_separate(store):
    seed_demo(store)
    seed_demo(store)
    assert len(store.posts('demo')) == 210
    assert store.posts('live') == []
    assert len(analyse(store.posts('demo'))) == 3


def test_collector_filters_updates_and_deletions(store):
    collector = Collector(store)
    collector.process(event())
    collector.process(event())  # At-least-once replay must not duplicate a record.
    assert len(store.posts('live')) == 1
    collector.process(event('update', 'A completely unrelated book review.'))
    assert not store.posts('live')
    collector.process(event())
    collector.process(event('delete'))
    assert not store.posts('live')
    collector.process(event())
    collector.process({'did': 'did:plc:test', 'kind': 'account', 'account': {'active': False}})
    assert not store.posts('live')


def test_v2_and_language_filter(store):
    collector = Collector(store)
    frame = {'payload': {'$type': 'network.bsky.jetstream.subscribeEvents#commit', 'did': 'did:plc:test', 'seq': 1, **event()['commit']}}
    collector.process(frame)
    assert len(store.posts('live')) == 1
    store.set('source_settings', {'keywords': [], 'languages': ['en'], 'retention_days': 7})
    collector.settings(refresh=True)  # same invalidation used by the settings API
    collector.process(event(rkey='two'))
    assert len(store.posts('live')) == 1


def test_detector_requires_distinct_authors_and_time_window():
    posts = [make_post('did:example:same', str(i), {'text': 'A sufficiently long repeated message about transport in Jakarta.', 'createdAt': f'2026-01-01T00:00:0{i}Z'}, 'synthetic') for i in range(5)]
    assert not analyse(posts)
    posts[1]['did'], posts[2]['did'] = 'did:example:b', 'did:example:c'
    assert analyse(posts)
    posts[2]['created_at'] = '2026-01-01T01:00:00+00:00'
    assert not analyse(posts)


def test_simulation_responds_to_time_and_threshold():
    fast = simulate(12, 8)
    slow = simulate(12, 600)
    assert fast['recall'] == 1 and fast['precision'] == 1
    assert slow['detected'] == 0 and slow['recall'] == 0
    assert simulate(2, 8, 3)['detected'] == 0


def test_api_end_to_end_and_persistence(tmp_path, monkeypatch):
    monkeypatch.setenv('TELISIK_DB_PATH', str(tmp_path / 'api.sqlite'))
    import backend.main as module
    module = importlib.reload(module)
    with TestClient(module.app) as client:
        assert client.get('/api/health').status_code == 200
        assert client.get('/api/overview').json()['posts'] == 210
        assert client.get('/api/posts?q=hoaks&limit=2').json()['total'] == 30
        assert client.get('/api/posts?page=0').status_code == 422
        assert len(client.get('/api/coordination').json()['clusters']) == 3
        brief = client.post('/api/briefs', json={}).json()
        assert brief['status'] == 'Draft' and brief['provider'] == 'Local template (no LLM)'
        assert client.post(f"/api/briefs/{brief['id']}/review").json()['status'] == 'Reviewed'
        exported = client.get(f"/api/briefs/{brief['id']}/export")
        assert exported.status_code == 200 and 'Evidence snapshot' in exported.text
        assert client.put('/api/sources/settings', json={'keywords': [' JAKARTA ', 'jakarta'], 'languages': [], 'retention_days': 3}).json()['settings']['keywords'] == ['jakarta']
        assert client.put('/api/mode', json={'mode': 'live'}).status_code == 200
        assert client.get('/api/overview').json()['posts'] == 0
        assert client.get('/api/briefs').json()['items'] == []
        assert client.post('/api/briefs', json={}).status_code == 400
        assert client.post('/api/simulation', json={'actors': 12}).json()['recall'] == 1
        assert client.post('/api/simulation', json={'actors': 1000}).status_code == 422
        client.put('/api/mode', json={'mode': 'demo'})
        assert client.post('/api/sources/start').status_code == 409
    module = importlib.reload(module)
    assert module.store.briefs()[0]['status'] == 'Reviewed'


def test_collector_lifecycle_does_not_duplicate_tasks(store, monkeypatch):
    import asyncio
    async def exercise():
        collector = Collector(store)
        async def fake_run():
            try:
                await asyncio.Event().wait()
            finally:
                collector.state.update(running=False, connected=False)
        monkeypatch.setattr(collector, 'run', fake_run)
        collector.start()
        task = collector.task
        collector.start()
        assert collector.task is task
        await asyncio.sleep(0)
        await collector.stop()
        assert not collector.state['running']
    asyncio.run(exercise())

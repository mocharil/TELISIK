import asyncio
import importlib
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from backend.collector import Collector, CURSOR_KEY
from backend.core import Store, make_post
from backend.network import network

def frame(seq,op='create',rkey='one',text='Banjir Jakarta, check the source.',did='did:plc:alpha'):
    return {'payload':{'$type':'network.bsky.jetstream.subscribeEvents#commit','did':did,'seq':seq,'collection':'app.bsky.feed.post','operation':op,'rkey':rkey,'record':{'text':text,'createdAt':datetime.now(timezone.utc).isoformat(),'langs':['id']}}}

def test_v2_cursor_replay_delete_update_and_restart(tmp_path):
    store=Store(tmp_path/'state.sqlite'); c=Collector(store)
    c.process(frame(10)); c.process(frame(10))
    assert len(store.posts('live'))==1 and c.state['accepted']==1
    c.process(frame(11,op='delete')); c.process(frame(10))
    assert store.posts('live')==[]
    c.checkpoint(); assert store.get(CURSOR_KEY)==11
    resumed=Collector(Store(tmp_path/'state.sqlite'))
    resumed.process(frame(10)); assert store.posts('live')==[]
    resumed.process(frame(12)); resumed.process(frame(13,'update',text='An unrelated book review.'))
    assert store.posts('live')==[]
    # Deactivation events are not filtered out, even though post collection is filtered.
    resumed.process(frame(14)); resumed.process({'payload':{'$type':'network.bsky.jetstream.subscribeEvents#account','did':'did:plc:alpha','seq':15,'active':False}})
    assert not store.posts('live')

def test_graph_evidence_and_missing_parent_are_honest():
    a=make_post('did:plc:a','one',{'text':'Same exact repeated post with enough text for a pattern match.'})
    b=make_post('did:plc:b','two',{'text':a['text']})
    assert network([a,b],'live')['edges']==[]
    b['reply_to']=a['uri']; g=network([a,b],'live')
    assert g['edges'][0]['source']==a['did'] and g['edges'][0]['target']==b['did']
    assert g['edges'][0]['evidence'][0]['post']['uri']==b['uri']
    missing=network([b],'live'); assert missing['unresolved']==1 and not missing['edges']
    b['quote_of']=a['uri']; assert network([a,b],'live')['edges'][0]['weight']==2

def test_real_websocket_protocol_with_in_process_feed(tmp_path,monkeypatch):
    import websockets
    import backend.collector as module
    async def exercise():
        seen=[]
        done=asyncio.Event()
        async def feed(ws):
            seen.append((ws.subprotocol,ws.request.path))
            await ws.send(__import__('json').dumps(frame(101)))
            await asyncio.sleep(.05)
            await ws.send(__import__('json').dumps(frame(102,'delete')))
            await done.wait()
        async with websockets.serve(feed,'127.0.0.1',0,subprotocols=['xrpc.v1.json']) as server:
            port=server.sockets[0].getsockname()[1]
            monkeypatch.setattr(module,'ENDPOINT',f'ws://127.0.0.1:{port}/xrpc/network.bsky.jetstream.subscribeEvents')
            c=Collector(Store(tmp_path/'socket.sqlite')); c.start()
            try:
                async def _wait_seq():
                    while c.last_seq!=102: await asyncio.sleep(.01)
                await asyncio.wait_for(_wait_seq(), timeout=3)
                assert c.state['connected'] and c.state['accepted']==1 and c.state['deleted']==1
                assert not c.store.posts('live')
            finally:
                done.set()
                await c.stop()
            assert c.store.get(CURSOR_KEY)==102 and not c.state['running']
            assert seen[0][0]=='xrpc.v1.json' and 'collections=app.bsky.feed.post' in seen[0][1]
    asyncio.run(exercise())

def test_live_api_end_to_end_no_paid_ai_and_origin_guard(tmp_path,monkeypatch):
    monkeypatch.setenv('TELISIK_DB_PATH',str(tmp_path/'api.sqlite'))
    monkeypatch.setenv('GEMINI_DISABLED','1')
    import backend.main as module
    module=importlib.reload(module)
    with TestClient(module.app) as client:
        assert client.post('/api/sources/start',headers={'origin':'https://foreign.example'}).status_code==403
        client.put('/api/mode',json={'mode':'live'})
        assert client.get('/api/overview').json()['posts']==0
        assert client.get('/api/network').json()['edges']==[]
        module.collector.process(frame(200))
        f=frame(201,rkey='two',did='did:plc:beta'); f['payload']['record']['reply']={'parent':{'uri':'at://did:plc:alpha/app.bsky.feed.post/one'}}
        module.collector.process(f)
        assert client.get('/api/posts').json()['total']==2
        g=client.get('/api/network').json(); assert len(g['edges'])==1 and g['connected_accounts']==2
        assert len(client.get('/api/posts/export').text.splitlines())==2
        assert client.post('/api/briefs',json={'use_gemini':True}).status_code==409
        assert client.get('/api/health').json()['gemini_configured'] is False
        assert client.get('/api/network?limit=2000').status_code==422
        module.collector.process(frame(202,'delete'))
        assert client.get('/api/network').json()['unresolved']==1
        assert client.get('/api/posts').json()['total']==1


def test_gemini_sa_brief_generation(tmp_path, monkeypatch):
    monkeypatch.setenv('TELISIK_DB_PATH', str(tmp_path / 'gemini.sqlite'))
    monkeypatch.delenv('GEMINI_DISABLED', raising=False)
    import backend.gemini as gem
    import backend.main as module
    module = importlib.reload(module)
    monkeypatch.setattr(
        gem,
        'call_vertex_gemini',
        lambda prompt, system_instruction, response_schema=None, explicit_path=None: (
            {
                'title': 'Gemini SA Flood Review',
                'summary': 'Synthesized via Service Account.',
                'findings': [{'text': 'Observed matching transport posts.', 'citations': ['invalid://uri']}],
                'limitations': ['Filtered sample only.'],
                'next_steps': ['Verify with primary sources.'],
            },
            'Vertex AI Gemini (gemini-3.8-flash)',
        ),
    )
    with TestClient(module.app) as client:
        health = client.get('/api/health').json()
        assert health['gemini_configured'] is True
        resp = client.post('/api/briefs', json={'use_gemini': True})
        assert resp.status_code == 201
        data = resp.json()
        assert data['provider'] == 'Vertex AI Gemini (gemini-3.8-flash)'
        assert data['title'] == 'Gemini SA Flood Review'
        assert all(u.startswith('at://') for f in data['findings'] for u in f['citations'])

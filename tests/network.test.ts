import assert from 'node:assert/strict';
import { actors, records, eventById, fullNetwork, buildNetwork, ancestry, milestones, betweenness, detectCommunities, aggregate, fixedCommunities, stressTest, type Edge } from '../src/investigation/model';

for (const record of records) {
  assert.ok(actors.some(a => a.id === record.actor));
  if (record.parent) assert.ok(eventById.get(record.parent)!.minute < record.minute, 'References must point to earlier records');
  else assert.equal(record.kind, 'original');
}

function verifyEdges(network: ReturnType<typeof buildNetwork>, minute = 240, kind = 'all') {
  const ids = new Set(network.nodes.map(n => n.id));
  for (const edge of network.edges) {
    assert.ok(ids.has(edge.source) && ids.has(edge.target));
    assert.equal(edge.weight, edge.events.length);
    for (const e of edge.events) {
      assert.equal(e.actor, edge.target);
      assert.equal(eventById.get(e.parent!)!.actor, edge.source);
      assert.ok(e.minute <= minute);
      if (kind !== 'all') assert.equal(e.kind, kind, 'Context posts must not leak another interaction layer');
    }
  }
}
verifyEdges(fullNetwork);
for (const minute of [0, 18, 42, 79, 120, 132, 180, 240]) {
  for (const kind of ['all', 'quote', 'reply', 'repost'] as const) verifyEdges(buildNetwork(minute, new Set(), kind), minute, kind);
}
assert.equal(buildNetwork(0).nodes.length, 1);
assert.equal(buildNetwork(0).edges.length, 0);
assert.equal(fullNetwork.nodes.length, 192);
assert.equal(fullNetwork.nodes.filter(n => n.degree === 0).length, 12);
for (const node of fullNetwork.nodes.filter(n => Number(n.id.slice(1)) >= 180)) assert.equal(node.degree, 0, 'Matching text alone must not create connections');
assert.deepEqual(ancestry(milestones[2].event).map(e => e.actor), ['u000','u014','u053','u058']);
assert.deepEqual(ancestry(milestones[4].event).map(e => e.actor), ['u148','u143']);

const edge = (source: string, target: string): Edge => ({id: `${source}>${target}`, source, target, events: [], weight: 1, types: new Set()});
const star = betweenness(['a','b','c','d'], [edge('a','b'),edge('a','c'),edge('a','d')]);
assert.equal(star.get('a'), 1, 'Normalized star center betweenness');
assert.equal(star.get('b'), 0);
const raw = aggregate(records);
assert.deepEqual([...detectCommunities(raw.nodes,raw.edges)], [...fixedCommunities], 'Louvain colors must be reproducible');
const withoutBridge = stressTest(fullNetwork, 'u058');
assert.ok(withoutBridge.largestComponent < fullNetwork.largestComponent);
assert.ok(withoutBridge.originReach < fullNetwork.originReach);
const removed = buildNetwork(240, new Set(['u058']));
assert.ok(!removed.nodes.some(n => n.id === 'u058'));
assert.ok(!removed.edges.some(e => e.source === 'u058' || e.target === 'u058'));
assert.equal(removed.largestComponent, withoutBridge.largestComponent);
assert.equal(removed.originReach, withoutBridge.originReach);
console.log(JSON.stringify({result: 'passed', accounts: fullNetwork.nodes.length, records: records.length, relationships: fullNetwork.edges.length, communities: fullNetwork.communities, removal: {account: 'u058', before: {component: fullNetwork.largestComponent, reachable: fullNetwork.originReach}, after: withoutBridge}}, null, 2));

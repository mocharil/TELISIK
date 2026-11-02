import assert from 'node:assert/strict';
import { eventById, records, fullNetwork } from '../src/investigation/model';
import { auditSample, canonicalUrl, claimAssessment, evidenceItems, findRepeatedShares, initialArena, narrativeVersions, parseArena, shareEvents, sourceDocuments, wordDiff, wordingNotes, type ShareEvent } from '../src/investigation/case-analysis';

// The diff must reconstruct both inputs exactly, including punctuation and Unicode.
for(const [before,after] of [
  ['',''],['','a'],['a',''],['same text','same text'],['sementara.','permanen?'],
  ['A  B\nC','A B\nD'],['Kota café, 東京!','Kota café? 東京!'],
  ...narrativeVersions.flatMap(a=>narrativeVersions.map(b=>[a.record.text,b.record.text])),
]) {
  const diff=wordDiff(before,after);
  assert.equal(diff.filter(p=>p.kind!=='added').map(p=>p.text).join(''),before);
  assert.equal(diff.filter(p=>p.kind!=='removed').map(p=>p.text).join(''),after);
  if(before===after)assert.ok(diff.every(p=>p.kind==='same'));
}
assert.ok(wordingNotes(narrativeVersions[0].record.text,narrativeVersions[1].record.text).some(n=>n.includes('sementara')));
assert.ok(wordingNotes(narrativeVersions[1].record.text,narrativeVersions[2].record.text).some(n=>n.includes('question mark')));
assert.equal(canonicalUrl('https://example.invalid/a?utm_source=x&part=1#top'),'https://example.invalid/a?part=1');
assert.notEqual(canonicalUrl('https://example.invalid/a?part=1'),canonicalUrl('https://example.invalid/a?part=2'));
assert.equal(canonicalUrl('https://example.invalid/a?b=2&fbclid=x&a=1'),'https://example.invalid/a?a=1&b=2');
const pairs=findRepeatedShares(shareEvents,3,2);
assert.equal(pairs.length,15);
assert.ok(pairs.every(p=>p.urls.length===3 && p.events.length===6 && p.maxDelay<=2));
assert.equal(findRepeatedShares(shareEvents,3,4).length,0);
assert.ok(findRepeatedShares(shareEvents,1,2).length < pairs.length);
assert.deepEqual(findRepeatedShares([...shareEvents,...shareEvents],3,2),pairs,'Repeated event IDs must not inflate the result');
const event=(id:string,actor:string,minute:number,url:string):ShareEvent=>({id,actor,minute,url,text:''});
assert.equal(findRepeatedShares([event('1','a',1,'https://example.invalid/a'),event('2','b',2,'https://example.invalid/a')],3,2).length,0,'One shared URL is not repeated multi-URL evidence');
assert.equal(findRepeatedShares([event('1','a',1,'https://example.invalid/a'),event('2','a',1,'https://example.invalid/a')],3,1).length,0,'An account cannot match itself');
assert.equal(findRepeatedShares([event('1','a',1,'https://example.invalid/a?part=1'),event('2','b',1,'https://example.invalid/a?part=2')],3,1).length,0,'Distinct content parameters must not be collapsed');
for(const evidence of evidenceItems)for(const id of evidence.sourceIds)assert.ok(eventById.has(id)||shareEvents.some(e=>e.id===id),'Every evidence source must resolve');
assert.deepEqual(parseArena('not json'),initialArena());
assert.deepEqual(parseArena(JSON.stringify({organic:{E01:{placement:'invented',note:17}}})),initialArena());
const changed=initialArena();changed.organic.E01={placement:'supports',note:'An analyst note'};assert.deepEqual(parseArena(JSON.stringify(changed)),changed);
assert.notEqual(initialArena().organic,initialArena().structured,'Hypotheses must have independent placements');
for(const claim of ['C01','C02','C03'])for(const doc of sourceDocuments){const result=claimAssessment(claim,doc.id);for(const id of result.sections)assert.ok(doc.sections.some(s=>s.id===id),'Citations must identify a real document section');}
assert.equal(claimAssessment('C02','DOC-01').verdict,'contradicts');
assert.equal(claimAssessment('C01','DOC-03').verdict,'insufficient');
assert.equal(claimAssessment('C03','DOC-01').verdict,'insufficient');
assert.equal(claimAssessment('C03','DOC-02').verdict,'contradicts');
const complete=auditSample({outage:false,missingParents:false,omitCircle:false});
assert.equal(complete.retained.length,records.length);assert.equal(complete.omitted.length,0);assert.equal(complete.unresolved.length,0);assert.equal(complete.explicitLinks,fullNetwork.edges.length);
for(const outage of [false,true])for(const missingParents of [false,true])for(const omitCircle of [false,true]){
  const audit=auditSample({outage,missingParents,omitCircle}),retained=new Set(audit.retained.map(e=>e.id));
  assert.equal(audit.retained.length+audit.omitted.length,records.length);
  assert.equal(audit.bins.reduce((sum,b)=>sum+b.count,0),audit.retained.length);
  assert.equal(audit.bins.filter(b=>b.outage).length,outage?3:0);
  for(const item of audit.unresolved){assert.ok(retained.has(item.event.id));assert.ok(!retained.has(item.parent));}
  for(const event of audit.omitted)assert.ok(audit.causes[event.id]?.length);
  if(outage)assert.ok(!audit.retained.some(e=>e.minute>=60&&e.minute<90));
}
assert.equal(records.length,637,'Sampling experiments must not mutate the source fixture');
console.log('Passed: lossless text diffs; exact URL/timing pairs; evidence provenance; independent hypothesis drafts; source citations; all 8 sampling scenarios.');

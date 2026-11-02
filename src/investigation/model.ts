/** Fictional post records, explicit interaction edges, and transparent graph analysis. */
import { UndirectedGraph } from 'graphology';
import louvain from 'graphology-communities-louvain';

export type Relation = 'original' | 'reply' | 'quote' | 'repost';
export type Frame = 'temporary' | 'permanent' | 'clarification';
export type Actor = { id: string; handle: string; name: string };
export type RecordEvent = { id: string; uri: string; actor: string; minute: number; kind: Relation; parent: string | null; text: string; frame: Frame };
export type Edge = { id: string; source: string; target: string; events: RecordEvent[]; weight: number; types: Set<Relation> };
export type NetworkNode = Actor & { community: number; references: number; degree: number; bridge: number; events: number; firstMinute: number };
export type Network = { nodes: NetworkNode[]; edges: Edge[]; records: RecordEvent[]; communities: { id: number; count: number; label: string }[]; crossEdges: number; components: number; largestComponent: number; originReach: number };
export const frameLabels: Record<Frame, string> = { temporary: 'Temporary closure', permanent: 'Permanent closure claim', clarification: 'Clarification' };
export const frameColors: Record<Frame, string> = { temporary: '#2457e7', permanent: '#d58a0b', clarification: '#009b7d' };
export const communityColors = ['#2457e7', '#009b86', '#d58a0b', '#dc496b', '#7945d0', '#63758e'];
export function random(seed: number) { let value = seed; return () => { value |= 0; value = value + 0x6D2B79F5 | 0; let t = Math.imul(value ^ value >>> 15, 1 | value); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = random(217);
const names = ['Nara','Bayu','Citra','Dimas','Elin','Fajar','Gita','Hana','Indra','Jati','Kirana','Laras','Mira','Niko','Oka','Putri','Raka','Sari','Tara','Vina','Wira','Yara','Zaki','Adit'];
export const actors: Actor[] = Array.from({ length: 192 }, (_, i) => ({ id: `u${String(i).padStart(3,'0')}`, name: `${names[i % names.length]} ${String(i + 1).padStart(3,'0')}`, handle: `${names[i % names.length].toLowerCase()}.${String(i+1).padStart(3,'0')}.example` }));
actors[0].name='Info Rute Cendana'; actors[0].handle='info.rute.example';
actors[14].name='Suara Penumpang'; actors[14].handle='suara.penumpang.example';
actors[53].name='Lintas Rute'; actors[53].handle='lintas.rute.example';
actors[58].name='Obrolan Kota'; actors[58].handle='obrolan.kota.example';
actors[98].name='Ruang Warga'; actors[98].handle='ruang.warga.example';
actors[102].name='Catatan Komuter'; actors[102].handle='catatan.komuter.example';
actors[143].name='Cek Konteks'; actors[143].handle='cek.konteks.example';
actors[148].name='Klarifikasi Rute'; actors[148].handle='klarifikasi.rute.example';
const baseText: Record<Frame,string> = {
  temporary: 'Halte Cendana ditutup sementara untuk perawatan akhir pekan. Layanan kembali setelah pekerjaan selesai.',
  permanent: 'Katanya Halte Cendana ditutup permanen. Rute harian kita bagaimana? Perlu informasi yang lebih jelas.',
  clarification: 'Klarifikasi skenario: penutupan Halte Cendana hanya sementara untuk perawatan, bukan penutupan permanen.',
};
const generated: RecordEvent[]=[];
function add(actor: number, minute: number, kind: Relation, parent: RecordEvent | null, frame?: Frame, custom?: string): RecordEvent {
  const id=`case-post-${String(generated.length+1).padStart(4,'0')}`;
  const chosenFrame=frame || parent?.frame || 'temporary';
  const text=custom || (kind==='repost' ? parent!.text : kind==='reply' ? `Menanggapi kabar Halte Cendana: ${chosenFrame==='clarification' ? 'Terima kasih, konteks ini penting sebelum dibagikan lagi.' : 'Ada sumber dan tanggal yang bisa diperiksa?'} ${baseText[chosenFrame]}` : baseText[chosenFrame]);
  const record={id,uri:`at://did:example:${actors[actor].id}/app.bsky.feed.post/${id}`,actor:actors[actor].id,minute,kind,parent:parent?.id || null,text,frame:chosenFrame};
  generated.push(record);return record;
}
const seed=add(0,0,'original',null,'temporary');
const mutation=add(14,18,'quote',seed,'permanent','Halte Cendana ditutup permanen? Saya hanya melihat potongan kabarnya. Ada yang punya konteks lengkap?');
const connector=add(53,33,'quote',mutation,'permanent');
const rootB=add(58,42,'quote',connector,'permanent');
const connectorB=add(98,66,'repost',rootB,'permanent');
const rootC=add(102,79,'quote',connectorB,'permanent');
add(143,106,'reply',rootC,'permanent');
const correction=add(148,120,'original',null,'clarification');
const correctionBridge=add(143,132,'quote',correction,'clarification');
const cohorts=[{start:0,end:58,root:seed,begin:3},{start:58,end:102,root:rootB,begin:44},{start:102,end:148,root:rootC,begin:82},{start:148,end:180,root:correction,begin:123}];
// Seed explicit references first; every later interaction references an earlier post.
for(const cohort of cohorts){
  for(let i=cohort.start;i<cohort.end;i++){
    if(generated.some(e=>e.actor===actors[i].id))continue;
    const minute=cohort.begin+Math.floor(rng()*75);
    const candidates=generated.filter(e=>e.minute<minute && e.actor!==actors[i].id && Number(e.actor.slice(1))>=cohort.start && Number(e.actor.slice(1))<cohort.end);
    const preferred=candidates.filter(e=>[cohort.start,cohort.start+1,cohort.start+3,cohort.start+9,14].includes(Number(e.actor.slice(1))));
    const pool=rng()<.58 && preferred.length ? preferred : candidates;
    const parent=pool.length ? pool[Math.floor(rng()*pool.length)] : cohort.root;
    add(i,Math.max(minute,parent.minute+1),rng()<.63?'repost':'reply',parent);
  }
}
// Local conversations add cycles and multiple relationships, rather than decorative links.
for(let round=0;round<3;round++)for(const cohort of cohorts)for(let i=cohort.start;i<cohort.end;i++){
  if(rng()<.2)continue;
  const first=generated.filter(e=>e.actor===actors[i].id).sort((a,b)=>a.minute-b.minute)[0];
  const minute=Math.min(239,Math.max(first.minute+2,cohort.begin+35)+Math.floor(rng()*Math.max(1,202-cohort.begin-35)));
  const candidates=generated.filter(e=>e.minute<minute && e.actor!==actors[i].id && Number(e.actor.slice(1))>=cohort.start && Number(e.actor.slice(1))<cohort.end);
  const localRoots=candidates.filter(e=>[cohort.start,cohort.start+1,cohort.start+3,cohort.start+9].includes(Number(e.actor.slice(1))));
  const pool=rng()<.45 && localRoots.length?localRoots:candidates;
  let parent=pool[Math.floor(rng()*pool.length)] || cohort.root;
  if(cohort.start===102 && minute>140 && i!==143 && rng()<.36)parent=correctionBridge;
  const draw=rng();add(i,minute,draw<.43?'repost':draw<.78?'reply':'quote',parent);
}
// Identical standalone text deliberately creates no network edges.
for(let i=180;i<192;i++)add(i,20+Math.floor(rng()*210),'original',null,'temporary','Ada yang punya informasi lengkap soal Halte Cendana? Saya menunggu sumber yang jelas.');
export const records=generated.sort((a,b)=>a.minute-b.minute || a.id.localeCompare(b.id));
export const eventById=new Map(records.map(e=>[e.id,e]));
export const actorById=new Map(actors.map(a=>[a.id,a]));
export const milestones=[
  {minute:0,title:'First observed post',description:'The original says “temporary closure”.',event:seed.id},
  {minute:18,title:'The wording changes',description:'A quote introduces “permanent closure?”.',event:mutation.id},
  {minute:42,title:'A different circle joins',description:'An explicit quote connects two parts of the network.',event:rootB.id},
  {minute:120,title:'Clarification appears',description:'A separate post restores the missing context.',event:correction.id},
  {minute:132,title:'The clarification crosses over',description:'A quote carries it into another circle.',event:correctionBridge.id},
];
export const clock=(minute:number)=>`${String(8+Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
export function ancestry(id: string): RecordEvent[] {
  const result:RecordEvent[]=[],seen=new Set<string>();let current=eventById.get(id);
  while(current && !seen.has(current.id)){result.unshift(current);seen.add(current.id);current=current.parent ? eventById.get(current.parent) : undefined;}
  return result;
}
export function aggregate(activeRecords: RecordEvent[], excluded=new Set<string>(), contextRecords=activeRecords): { nodes: Actor[]; edges: Edge[] } {
  const active=new Set(contextRecords.filter(e=>!excluded.has(e.actor)).map(e=>e.actor)),byPair=new Map<string,Edge>();
  for(const event of activeRecords){
    if(!event.parent || excluded.has(event.actor))continue;
    const parent=eventById.get(event.parent);
    if(!parent || parent.minute>event.minute || excluded.has(parent.actor) || parent.actor===event.actor || !active.has(parent.actor))continue;
    const id=`${parent.actor}>${event.actor}`;
    const edge=byPair.get(id) || {id,source:parent.actor,target:event.actor,events:[],weight:0,types:new Set<Relation>()};
    edge.events.push(event);edge.weight++;edge.types.add(event.kind);byPair.set(id,edge);
  }
  return {nodes:actors.filter(a=>active.has(a.id)),edges:[...byPair.values()]};
}
function neighbors(ids:string[],edges:Edge[],directed=false){const map=new Map(ids.map(id=>[id,new Set<string>()]));for(const e of edges){map.get(e.source)?.add(e.target);if(!directed)map.get(e.target)?.add(e.source);}return map;}
export function reachable(origin:string,ids:string[],edges:Edge[]):Set<string>{const map=neighbors(ids,edges,true),seen=new Set<string>();if(!map.has(origin))return seen;const queue=[origin];seen.add(origin);for(let i=0;i<queue.length;i++)for(const n of map.get(queue[i]) || [])if(!seen.has(n)){seen.add(n);queue.push(n);}seen.delete(origin);return seen;}
export function components(ids:string[],edges:Edge[]){const map=neighbors(ids,edges),seen=new Set<string>(),groups:string[][]=[];for(const id of ids){if(seen.has(id))continue;const group=[id];seen.add(id);for(let i=0;i<group.length;i++)for(const n of map.get(group[i]) || [])if(!seen.has(n)){seen.add(n);group.push(n);}groups.push(group);}return groups.sort((a,b)=>b.length-a.length);}
export function betweenness(ids:string[],edges:Edge[]):Map<string,number>{
  const adjacency=neighbors(ids,edges),score=new Map(ids.map(id=>[id,0]));
  for(const source of ids){
    const stack:string[]=[],parents=new Map(ids.map(id=>[id,[] as string[]])),paths=new Map(ids.map(id=>[id,0])),distance=new Map(ids.map(id=>[id,-1])),queue=[source];paths.set(source,1);distance.set(source,0);
    for(let i=0;i<queue.length;i++){const v=queue[i];stack.push(v);for(const w of adjacency.get(v) || []){if(distance.get(w)===-1){queue.push(w);distance.set(w,distance.get(v)!+1);}if(distance.get(w)===distance.get(v)!+1){paths.set(w,paths.get(w)!+paths.get(v)!);parents.get(w)!.push(v);}}}
    const dependency=new Map(ids.map(id=>[id,0]));while(stack.length){const w=stack.pop()!;for(const v of parents.get(w)!)dependency.set(v,dependency.get(v)!+paths.get(v)!/paths.get(w)!*(1+dependency.get(w)!));if(w!==source)score.set(w,score.get(w)!+dependency.get(w)!);}
  }
  const denominator=Math.max(1,(ids.length-1)*(ids.length-2));for(const [id,value] of score)score.set(id,value/denominator);return score;
}
export function detectCommunities(nodes:Actor[],edges:Edge[]):Map<string,number>{
  const graph=new UndirectedGraph();for(const n of nodes)graph.addNode(n.id);
  for(const e of edges){if(graph.hasEdge(e.source,e.target))graph.updateEdgeAttribute(e.source,e.target,'weight',(w:number)=>w+e.weight);else graph.addEdge(e.source,e.target,{weight:e.weight});}
  if(!edges.length)return new Map(nodes.map((n,i)=>[n.id,i]));
  const detected=louvain(graph,{resolution:1,rng:random(7),randomWalk:false});
  const sizes=new Map<number,number>();for(const label of Object.values(detected))sizes.set(label,(sizes.get(label)||0)+1);
  const sorted=[...sizes].sort((a,b)=>b[1]-a[1]).map(([id])=>id),remap=new Map(sorted.map((id,index)=>[id,index]));
  return new Map(nodes.map(n=>[n.id,remap.get(detected[n.id])!]));
}
const fullRaw=aggregate(records);
export const fixedCommunities=detectCommunities(fullRaw.nodes,fullRaw.edges);
export function buildNetwork(minute=240,excluded=new Set<string>(),relation:Relation|'all'='all'):Network{
  const active=records.filter(e=>e.minute<=minute && (relation==='all' || e.kind===relation || e.kind==='original'));
  // Include referenced context accounts so every displayed edge has both endpoints.
  const context=new Map(active.map(e=>[e.id,e]));for(const event of active)if(event.parent){const p=eventById.get(event.parent);if(p && p.minute<=minute)context.set(p.id,p);}
  const raw=aggregate(active,excluded,[...context.values()]),ids=raw.nodes.map(n=>n.id),bridge=betweenness(ids,raw.edges),counts=new Map<string,number>(),references=new Map<string,number>(),degree=neighbors(ids,raw.edges);
  for(const e of active)counts.set(e.actor,(counts.get(e.actor)||0)+1);for(const e of raw.edges)references.set(e.source,(references.get(e.source)||0)+e.weight);
  const nodes=raw.nodes.map(n=>({...n,community:fixedCommunities.get(n.id)!,references:references.get(n.id)||0,degree:degree.get(n.id)?.size||0,bridge:bridge.get(n.id)||0,events:counts.get(n.id)||0,firstMinute:Math.min(...records.filter(e=>e.actor===n.id).map(e=>e.minute))}));
  const sizes=new Map<number,number>();for(const n of nodes)if(n.degree)sizes.set(n.community,(sizes.get(n.community)||0)+1);
  const communities=[...sizes].sort((a,b)=>a[0]-b[0]).map(([id,count])=>({id,count,label:`Community ${String(id+1).padStart(2,'0')}`}));
  const groups=components(ids,raw.edges);
  return {nodes,edges:raw.edges,records:active.filter(e=>!excluded.has(e.actor)),communities,crossEdges:raw.edges.filter(e=>fixedCommunities.get(e.source)!==fixedCommunities.get(e.target)).length,components:groups.length,largestComponent:groups[0]?.length||0,originReach:reachable('u000',ids,raw.edges).size};
}
export const fullNetwork=buildNetwork();
export function bridgeRank(network:Network){return [...network.nodes].filter(n=>n.degree>1).sort((a,b)=>b.bridge-a.bridge || b.references-a.references);}
export function stressTest(network:Network,nodeId:string){const ids=network.nodes.filter(n=>n.id!==nodeId).map(n=>n.id),edges=network.edges.filter(e=>e.source!==nodeId && e.target!==nodeId),groups=components(ids,edges);return{actors:ids.length,edges:edges.length,largestComponent:groups[0]?.length||0,originReach:reachable('u000',ids,edges).size,components:groups.length};}

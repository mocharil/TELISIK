import { actorById, eventById, fixedCommunities, milestones, records, type RecordEvent } from './model';

export type DiffPart = { kind: 'same' | 'added' | 'removed'; text: string };
type SpacedToken = { space: string; word: string };
const tokenizeSpaced = (text: string): SpacedToken[] => {
  const out: SpacedToken[] = [];
  const re = /(\s*)([\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]+)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ space: m[1] || '', word: m[2] });
  }
  return out;
};
/** Longest common subsequence on words/punctuation preserves natural spacing within diff phrases. */
export function wordDiff(before: string, after: string): DiffPart[] {
  const a = tokenizeSpaced(before), b = tokenizeSpaced(after);
  const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
    table[i][j] = a[i].word === b[j].word ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const parts: DiffPart[] = [];
  function append(kind: DiffPart['kind'], text: string) {
    const last = parts[parts.length - 1];
    if (last?.kind === kind) last.text += text; else parts.push({ kind, text });
  }
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i].word === b[j].word) {
      const sp = a[i].space || b[j].space;
      append('same', sp + a[i].word);
      i++;
      j++;
    } else if (i < a.length && (j === b.length || table[i + 1][j] >= table[i][j + 1])) {
      append('removed', a[i].space + a[i].word);
      i++;
    } else {
      append('added', b[j].space + b[j].word);
      j++;
    }
  }
  return parts;
}
export const narrativeVersions = [
  { record: eventById.get(milestones[0].event)!, label: 'The source', subtitle: 'Temporary maintenance' },
  { record: eventById.get(milestones[1].event)!, label: 'A question appears', subtitle: '“Permanent?” enters the thread' },
  { record: records.find(e => e.actor === 'u053' && e.minute === 33)!, label: 'The question is dropped', subtitle: 'An attributed claim replaces it' },
  { record: eventById.get(milestones[3].event)!, label: 'A separate clarification', subtitle: 'Context is restored elsewhere' },
];
export type WordingCueItem = {
  id: string;
  badge: string;
  tone: 'rose' | 'amber' | 'teal' | 'violet';
  title: string;
  detail: string;
};
export function analyzeWordingCues(before: string, after: string): WordingCueItem[] {
  const cues: WordingCueItem[] = [];
  if (/sementara/i.test(before) && !/sementara/i.test(after)) {
    cues.push({
      id: 'drop-sementara',
      badge: 'Kualifikasi Hilang',
      tone: 'rose',
      title: 'Kata kualifikasi “sementara” dihilangkan dari teks pembanding',
      detail: 'Batasan waktu pada laporan awal tidak lagi disertakan, sehingga kejadian yang bersifat sementara tampak seperti kondisi tanpa batas waktu.',
    });
  }
  if (!/permanen/i.test(before) && /permanen/i.test(after)) {
    cues.push({
      id: 'add-permanen',
      badge: 'Klaim Absolut',
      tone: 'amber',
      title: 'Kata “permanen” muncul pada teks pembanding',
      detail: 'Periksa apakah kata ini diajukan sebagai pertanyaan warga atau sudah bergeser menjadi klaim kepastian tanpa rujukan resmi.',
    });
  }
  if ((/masih terkendali|evaluasi teknis/i.test(before)) && !(/masih terkendali|evaluasi teknis/i.test(after))) {
    cues.push({
      id: 'drop-context',
      badge: 'Konteks Reduksi',
      tone: 'rose',
      title: 'Keterangan penanganan (“masih terkendali / evaluasi teknis”) dihapus',
      detail: 'Penghilangan keterangan situasi terkendali membuat pembaca kehilangan konteks bahwa petugas sedang menangani titik terdampak.',
    });
  }
  if (!(/peringatan darurat|lumpuh|tidak tertangani sama sekali|sebarkan/i.test(before)) && (/peringatan darurat|lumpuh|tidak tertangani sama sekali|sebarkan/i.test(after))) {
    cues.push({
      id: 'escalation',
      badge: 'Eskalasi Urgensi',
      tone: 'amber',
      title: 'Penambahan diksi darurat & ajakan penyebaran berantai',
      detail: 'Frasa hiperbolis (“PERINGATAN DARURAT”, “lumpuh”, “tidak tertangani sama sekali”, atau “Sebarkan”) meningkatkan urgensi emosional pesan.',
    });
  }
  if (/permanen\s*\?/i.test(before) && !/permanen\s*\?/i.test(after)) {
    cues.push({
      id: 'drop-qmark',
      badge: 'Pergeseran Tanda Baca',
      tone: 'violet',
      title: 'Tanda tanya (?) setelah kata “permanen” dihilangkan',
      detail: 'Kalimat yang sebelumnya berbentuk pertanyaan berubah menjadi pernyataan deklaratif.',
    });
  } else if (before.includes('?') && !after.includes('?')) {
    cues.push({
      id: 'drop-question',
      badge: 'Pergeseran Tanda Baca',
      tone: 'violet',
      title: 'Tanda baca tanya (?) hilang pada versi pembanding',
      detail: 'Perubahan bentuk kalimat dari pertanyaan menjadi pernyataan mengubah tingkat kepastian klaim di mata pembaca.',
    });
  } else if (!before.includes('!') && after.includes('!')) {
    cues.push({
      id: 'add-exclamation',
      badge: 'Intonasi Teks',
      tone: 'violet',
      title: 'Perubahan tanda baca titik (.) menjadi tanda seru (!)',
      detail: 'Penggunaan tanda seru memperkuat nada peringatan dibandingkan laporan observasi awal yang bernada netral.',
    });
  }
  if (!/katanya/i.test(before) && /katanya/i.test(after)) {
    cues.push({
      id: 'add-katanya',
      badge: 'Atribusi Kabur',
      tone: 'amber',
      title: 'Kata “katanya” mengatribusikan klaim ke sumber tak spesifik',
      detail: 'Penambahan atribusi desas-desus (“katanya”) memberi kesan klaim berasal dari otoritas, meski belum terverifikasi.',
    });
  }
  if (/klarifikasi|terverifikasi/i.test(after)) {
    cues.push({
      id: 'clarification',
      badge: 'Klarifikasi Data',
      tone: 'teal',
      title: 'Teks pembanding memuat pemulihan konteks & verifikasi',
      detail: 'Menjelaskan kembali batasan waktu penanganan dan menyertakan rujukan data pantauan untuk meluruskan klaim yang beredar.',
    });
  }
  if (!cues.length) {
    cues.push({
      id: 'no-cue',
      badge: 'Pemeriksaan Leksikal',
      tone: 'violet',
      title: 'Tidak ada indikator kata kunci spesifik yang berubah',
      detail: 'Periksa rincian fragmen kata yang dihapus dan ditambahkan di bawah untuk melihat perbedaan redaksional secara langsung.',
    });
  }
  return cues;
}
export function wordingNotes(before: string, after: string): string[] {
  return analyzeWordingCues(before, after).map(c => `${c.title} — ${c.detail}`);
}

export type ShareEvent = { id: string; actor: string; minute: number; url: string; text: string };
const synchronizedActors = ['u058','u060','u062','u065','u068','u071'];
const resources = ['notice','cropped-notice','route-update'];
/** Supplemental fictional share records, separate from the 637 network post events. */
export const shareEvents: ShareEvent[] = resources.flatMap((resource, round) => synchronizedActors.map((actor, i) => ({
  id: `share-${round + 1}-${i + 1}`, actor, minute: 56 + round * 30 + i % 3,
  url: `https://cendana.example.invalid/${resource}?utm_source=sample-${i + 1}`,
  text: `Tautan skenario Halte Cendana: ${resource}.`,
}))).concat(Array.from({ length: 12 }, (_, i) => ({
  id: `share-news-${i + 1}`, actor: `u${String(20 + i * 3).padStart(3,'0')}`, minute: 170 + i * 4,
  url: 'https://cendana.example.invalid/daily-newsletter', text: 'Buletin harian pada skenario latihan.',
})));
export function canonicalUrl(input: string): string {
  const url = new URL(input);
  for (const key of [...url.searchParams.keys()]) if (/^utm_/i.test(key) || ['fbclid','gclid'].includes(key.toLowerCase())) url.searchParams.delete(key);
  url.hash = '';
  url.searchParams.sort();
  return url.toString();
}
export type PairSignal = { id: string; actors: [string, string]; urls: string[]; events: ShareEvent[]; minDelay: number; maxDelay: number };
export function findRepeatedShares(input: ShareEvent[], windowMinutes: number, minimumUrls: number): PairSignal[] {
  const unique = [...new Map(input.map(e => [e.id, e])).values()];
  const groups = new Map<string, ShareEvent[]>();
  for (const event of unique) { const url = canonicalUrl(event.url); groups.set(url, [...(groups.get(url) || []), event]); }
  const pairs = new Map<string, { actors: [string,string]; urls: Set<string>; events: Map<string, ShareEvent>; delays: number[] }>();
  for (const [url, events] of groups) {
    events.sort((a,b) => a.minute - b.minute || a.id.localeCompare(b.id));
    for (let i = 0; i < events.length; i++) for (let j = i + 1; j < events.length && events[j].minute - events[i].minute <= windowMinutes; j++) {
      const a = events[i], b = events[j];
      if (a.actor === b.actor) continue;
      const actors = [a.actor, b.actor].sort() as [string,string], id = actors.join('|');
      const pair = pairs.get(id) || { actors, urls: new Set<string>(), events: new Map<string,ShareEvent>(), delays: [] };
      pair.urls.add(url); pair.events.set(a.id,a); pair.events.set(b.id,b); pair.delays.push(b.minute - a.minute); pairs.set(id,pair);
    }
  }
  return [...pairs].filter(([,pair]) => pair.urls.size >= minimumUrls).map(([id,pair]) => ({
    id, actors: pair.actors, urls: [...pair.urls].sort(), events: [...pair.events.values()].sort((a,b) => a.minute-b.minute || a.id.localeCompare(b.id)), minDelay: Math.min(...pair.delays), maxDelay: Math.max(...pair.delays),
  })).sort((a,b) => b.urls.length-a.urls.length || a.maxDelay-b.maxDelay || a.id.localeCompare(b.id));
}

export type EvidenceItem = { id: string; title: string; detail: string; sourceIds: string[]; caveat: string };
export const evidenceItems: EvidenceItem[] = [
  { id:'E01',title:'The wording changes in an explicit quote',detail:'Suara Penumpang quotes the source and asks whether the closure is permanent.',sourceIds:[narrativeVersions[0].record.id,narrativeVersions[1].record.id],caveat:'A change in wording does not identify motive or coordination.' },
  { id:'E02',title:'Six accounts share three links in repeated short windows',detail:'Supplemental share records contain three different URLs shared by the same six fictional accounts within two minutes per URL.',sourceIds:shareEvents.filter(e=>!e.id.startsWith('share-news-')).map(e=>e.id),caveat:'A common subscription, scheduled publisher or shared event can produce similar timing.' },
  { id:'E03',title:'A quote connects two conversation circles',detail:'Obrolan Kota explicitly quotes Lintas Rute at 08:42.',sourceIds:[milestones[2].event],caveat:'An interaction path does not establish how the author first encountered a message.' },
  { id:'E04',title:'Clarification arrives through a separate source',detail:'Klarifikasi Rute publishes at 10:00; Cek Konteks quotes that record at 10:12.',sourceIds:[milestones[3].event,milestones[4].event],caveat:'Absence of a clarification in another circle is not proof it was never seen.' },
  { id:'E05',title:'Identical text exists without a reference edge',detail:'Twelve standalone original posts repeat the same wording but have no parent references.',sourceIds:records.filter(e=>Number(e.actor.slice(1))>=180).map(e=>e.id),caveat:'Identical text alone is insufficient to establish interaction or a shared operator.' },
  { id:'E06',title:'The sample has no off-platform exposure records',detail:'The case contains explicit post references and supplemental URL shares. Private messages, audience exposure and account ownership are unavailable.',sourceIds:[],caveat:'Neither hypothesis can be confirmed from this case alone.' },
];
export type Placement = 'supports' | 'challenges' | 'unresolved';
export type EvidenceDecision = { placement: Placement; note: string };
export type ArenaState = Record<string, Record<string, EvidenceDecision>>;
export const hypotheses = [
  { id:'organic', title:'Organic forwarding', statement:'The cross-circle spread can be explained by ordinary forwarding and conversation.', color:'#2457e7' },
  { id:'structured', title:'Structured amplification', statement:'The repeated link-sharing pattern warrants investigating a shared publishing process.', color:'#009b86' },
];
export function initialArena(): ArenaState {
  return Object.fromEntries(hypotheses.map(h => [h.id, Object.fromEntries(evidenceItems.map(e => [e.id, { placement: (h.id==='organic' ? e.id==='E03'?'supports':e.id==='E02'?'challenges':'unresolved' : e.id==='E02'?'supports':e.id==='E05'?'challenges':'unresolved') as Placement, note:'' }]))]));
}
export function parseArena(value: string | null): ArenaState {
  const result = initialArena();
  if (!value) return result;
  try { const stored = JSON.parse(value); for(const h of hypotheses) for(const e of evidenceItems) {
    const item=stored?.[h.id]?.[e.id];
    if(item && ['supports','challenges','unresolved'].includes(item.placement) && typeof item.note==='string') result[h.id][e.id]={placement:item.placement,note:item.note.slice(0,4000)};
  } } catch { /* A broken browser-local draft must not block the case. */ }
  return result;
}

export type SourceDocument = { id: string; title: string; publisher: string; time: string; context: string; sections: {id:string;heading:string;text:string}[] };
export const sourceDocuments: SourceDocument[] = [
  {id:'DOC-01',title:'Maintenance notice',publisher:'Cendana Transit · fictional training source',time:'Day 1 · 07:30',context:'Complete sample bulletin. A fictional primary source for this exercise only.',sections:[
    {id:'1',heading:'Service notice',text:'Halte Cendana ditutup sementara untuk perawatan akhir pekan.'},
    {id:'2',heading:'Reopening condition',text:'Layanan kembali setelah pekerjaan selesai. Jadwal pembukaan dikonfirmasi melalui pengumuman lanjutan.'},
    {id:'3',heading:'Temporary alternative',text:'Penumpang dapat menggunakan halte pengganti selama pekerjaan berlangsung.'},
    {id:'4',heading:'Scope of this notice',text:'Pengumuman ini mengatur pekerjaan perawatan. Tidak ada keputusan penutupan permanen dalam pengumuman ini.'},
  ]},
  {id:'DOC-02',title:'Context clarification',publisher:'Cendana Transit · fictional training source',time:'Day 1 · 10:00',context:'A separate fictional clarification. This is not a live government document.',sections:[
    {id:'1',heading:'Correction of context',text:'Penutupan Halte Cendana hanya sementara untuk perawatan, bukan penutupan permanen.'},
    {id:'2',heading:'Status at publication',text:'Pekerjaan masih berlangsung saat klarifikasi diterbitkan. Belum ada konfirmasi layanan telah kembali normal.'},
  ]},
  {id:'DOC-03',title:'Cropped notice image transcript',publisher:'Unknown source · fictional training artifact',time:'Publication time unknown',context:'Only the surviving crop is transcribed. Publisher, date and remaining lines are missing.',sections:[
    {id:'1',heading:'Visible text in crop',text:'HALTE CENDANA DITUTUP'},
    {id:'2',heading:'Missing context',text:'[Bagian keterangan durasi, tanggal, dan penerbit tidak tersedia pada potongan ini.]'},
  ]},
];
export type Verdict = 'supports' | 'contradicts' | 'insufficient';
export const reviewClaims = [
  {id:'C01',title:'The closure is temporary',statement:'Halte Cendana ditutup sementara untuk perawatan.',record:narrativeVersions[0].record.id,kind:'Statement from a sample post'},
  {id:'C02',title:'The closure is permanent',statement:'Halte Cendana ditutup permanen.',record:narrativeVersions[1].record.id,kind:'Assertion being tested; the original post asks a question'},
  {id:'C03',title:'Service has already reopened',statement:'Layanan Halte Cendana sudah kembali normal.',record:null,kind:'Analyst test statement, not a quote from the case'},
];
export function claimAssessment(claim: string, document: string): {verdict:Verdict;sections:string[];reason:string} {
  if(document==='DOC-03') return {verdict:'insufficient',sections:['1','2'],reason:'The crop confirms closure wording but omits duration, publication time and service status.'};
  if(claim==='C01') return {verdict:'supports',sections:['1'],reason:'This fictional document explicitly describes a temporary maintenance closure.'};
  if(claim==='C02') return {verdict:'contradicts',sections:document==='DOC-01'?['4']:['1'],reason:'This fictional document explicitly excludes a permanent closure. The selected source post is a question, not a confirmed announcement.'};
  return document==='DOC-02'?{verdict:'contradicts',sections:['2'],reason:'At the document’s publication time, maintenance is still underway. This does not establish the current status outside the scenario.'}:{verdict:'insufficient',sections:['2'],reason:'A reopening condition is not evidence that reopening has already happened.'};
}

export type SampleOptions = { outage: boolean; missingParents: boolean; omitCircle: boolean };
export type SampleAudit = { retained:RecordEvent[]; omitted:RecordEvent[]; unresolved:{event:RecordEvent;parent:string}[]; bins:{start:number;count:number;outage:boolean}[]; explicitLinks:number; causes:Record<string,string[]> };
export function auditSample(options:SampleOptions):SampleAudit {
  const causes:Record<string,string[]>={};
  const omitted=records.filter(e=>{
    const reasons:string[]=[];
    if(options.outage && e.minute>=60 && e.minute<90)reasons.push('Collector outage, 09:00–09:30');
    if(options.missingParents && (e.id===milestones[1].event || Number(e.id.slice(-4))%47===0))reasons.push('Post unavailable to collector');
    if(options.omitCircle && fixedCommunities.get(e.actor)===3)reasons.push('Community C04 omitted from sample');
    if(reasons.length)causes[e.id]=reasons;
    return reasons.length>0;
  });
  const hidden=new Set(omitted.map(e=>e.id)),retained=records.filter(e=>!hidden.has(e.id)),available=new Set(retained.map(e=>e.id));
  const unresolved=retained.filter(e=>e.parent && !available.has(e.parent)).map(e=>({event:e,parent:e.parent!}));
  const links=new Set(retained.flatMap(e=>{const parent=e.parent && available.has(e.parent)?eventById.get(e.parent):null;return parent && parent.actor!==e.actor?[`${parent.actor}>${e.actor}`]:[];}));
  const bins=Array.from({length:24},(_,i)=>({start:i*10,count:retained.filter(e=>e.minute>=i*10 && e.minute<(i+1)*10).length,outage:options.outage && i>=6 && i<9}));
  return {retained,omitted,unresolved,bins,explicitLinks:links.size,causes};
}
export function sourceLabel(id:string):string {
  const post=eventById.get(id);if(post)return `${actorById.get(post.actor)?.name} · ${id}`;
  const share=shareEvents.find(e=>e.id===id);return share?`${actorById.get(share.actor)?.name} · ${id}`:id;
}

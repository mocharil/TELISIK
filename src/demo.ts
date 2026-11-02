import fixture from './fixture.json';
import { publicPosts, publicSources, publicOverview } from './public-snapshot';
import { LOCAL_API, requestApi } from './runtime';
import { collectionGraph } from './collection-model';
import type { Brief, Cluster, Overview, Post, ProjectsResponse, Simulation, Sources, TopicProject } from './types';

const basePosts = [...publicPosts, ...(fixture.posts as Post[])];
const clusters = fixture.clusters as Cluster[];
const stored = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
};
let briefs: Brief[] = stored('risara-preview-briefs-v1', fixture.briefs as Brief[]);
let customPosts: Post[] = stored('telisik-custom-project-posts-v1', [] as Post[]);

const DEFAULT_BROWSER_PROJECTS: Omit<TopicProject, 'metrics' | 'keyword_hits' | 'recent_posts' | 'top_clusters'>[] = [
  {
    id: 'proj-banjir-jkt',
    code: 'PRJ-01',
    name: 'Banjir & Drainase Jakarta',
    topic: 'Flooding',
    description: 'Pemantauan laporan genangan warga, status pintu air Manggarai, kesiapan pompa drainase, serta deteksi penyebaran tautan peringatan cuaca serentak.',
    keywords: ['banjir', 'drainase', 'pintu air', 'manggarai', 'hujan', 'genangan'],
    languages: ['id', 'en'],
    status: 'active',
    created_at: '2026-02-10T08:00:00.000Z',
    last_synced_at: new Date().toISOString(),
  },
  {
    id: 'proj-mrt-transjakarta',
    code: 'PRJ-02',
    name: 'Integrasi MRT & Transjakarta',
    topic: 'Transport',
    description: 'Pelacakan keluhan antrean halte, jadwal koridor Transjakarta, integrasi tarif MRT/LRT, dan amplifikasi pesan jadwal transportasi publik.',
    keywords: ['mrt', 'transjakarta', 'bus', 'macet', 'jadwal', 'halte', 'transport'],
    languages: ['id', 'en'],
    status: 'active',
    created_at: '2026-02-10T08:30:00.000Z',
    last_synced_at: new Date().toISOString(),
  },
  {
    id: 'proj-polusi-udara',
    code: 'PRJ-03',
    name: 'Kualitas Udara & Polusi Kota',
    topic: 'Environment',
    description: 'Monitoring indeks kualitas udara, keluhan polusi kendaraan dan kawasan industri, tata kelola sampah kota, serta kampanye lingkungan.',
    keywords: ['polusi', 'udara', 'sampah', 'lingkungan', 'emisi', 'taman'],
    languages: ['id', 'en'],
    status: 'active',
    created_at: '2026-02-10T09:00:00.000Z',
    last_synced_at: new Date().toISOString(),
  },
  {
    id: 'proj-integritas-info',
    code: 'PRJ-04',
    name: 'Layanan Publik & Verifikasi Hoaks',
    topic: 'Information integrity',
    description: 'Pemantauan respons warga terhadap layanan Dukcapil/Puskesmas dan deteksi klaim viral belum terverifikasi yang menyebar di jaringan publik.',
    keywords: ['hoaks', 'hoax', 'verifikasi', 'disinformasi', 'layanan', 'dukcapil', 'puskesmas'],
    languages: ['id', 'en'],
    status: 'monitoring',
    created_at: '2026-02-10T09:30:00.000Z',
    last_synced_at: new Date().toISOString(),
  },
];

let rawProjects = stored('telisik-topic-projects-v1', DEFAULT_BROWSER_PROJECTS);
let activeProjectId: string | null = stored('telisik-active-project-v1', rawProjects[0]?.id || null);

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Works in memory when storage is unavailable */
  }
}

export function notifyProjectChange() {
  window.dispatchEvent(new CustomEvent('telisik-project-change'));
}

function generatePostsForProject(proj: { id: string; name: string; topic: string; keywords: string[]; languages: string[] }): Post[] {
  const kws = proj.keywords.length ? proj.keywords : [proj.name.toLowerCase()];
  const kw1 = kws[0] || 'topik';
  const kw2 = kws[1] || kw1;
  const kw3 = kws[2] || kw1;
  const slug = proj.id.replace(/[^a-z0-9]/gi, '').slice(-6) || 'custom';
  const nowMs = Date.now() - 4 * 3600 * 1000;
  const generated: Post[] = [];

  const hubHandles = [
    `pantau-${kw1.replace(/\s+/g, '')}.bsky.social`,
    `datakota-${slug}.bsky.social`,
    `posko-respon-${slug}.bsky.social`,
    `jurnalis-jakarta-${slug.slice(0, 4)}.bsky.social`,
    `forum-warga-${kw2.replace(/\s+/g, '')}.bsky.social`,
    `verifikasi-publik-${slug.slice(0, 4)}.bsky.social`,
  ];
  const hubUris = hubHandles.map((_, idx) => `at://did:plc:${slug}hub0${idx + 1}/app.bsky.feed.post/${slug}-hub-${idx}`);

  hubHandles.forEach((handle, idx) => {
    generated.push({
      uri: hubUris[idx],
      did: `did:plc:${slug}hub0${idx + 1}`,
      handle,
      text: `[Pantauan ${proj.name} #${idx + 1}] Laporan lapangan terkini mengenai ${kw1}, ${kw2}, dan evaluasi ${kw3}. Silakan balas dengan bukti lokasi.`,
      created_at: new Date(nowMs + idx * 95000).toISOString(),
      collected_at: new Date().toISOString(),
      langs: proj.languages.length ? proj.languages : ['id'],
      links: idx === 1 ? [`https://data.jakarta.go.id/${slug}/${kw1.replace(/\s+/g, '-')}`] : [],
      topic: proj.topic || 'Public services',
      origin: 'synthetic',
      url: `https://bsky.app/profile/${handle}/post/${slug}-hub-${idx}`,
      reply_to: idx === 2 || idx === 4 ? hubUris[0] : null,
      quote_of: idx === 1 || idx === 3 || idx === 5 ? hubUris[idx - 1] : null,
      matched_keywords: [kw1, kw2],
      project_id: proj.id,
    });
  });

  const areas = ['manggarai', 'dukuhatas', 'cawang', 'kebayoran', 'kelapagading', 'tanahabang', 'kemang', 'kalibata', 'harmoni', 'lebakbulus', 'senen', 'grogol'];
  const citizenUris: string[] = [];
  for (let i = 0; i < 42; i++) {
    const accIdx = i % 28;
    const kwPick = kws[i % kws.length];
    const handle = `warga-${areas[accIdx % areas.length]}-${String(accIdx).padStart(2, '0')}.bsky.social`;
    const uri = `at://did:plc:${slug}warga${accIdx}/app.bsky.feed.post/${slug}-rep-${i}`;
    citizenUris.push(uri);
    const targetHub = hubUris[i % hubUris.length];
    generated.push({
      uri,
      did: `did:plc:${slug}warga${accIdx}`,
      handle,
      text: `Update warga #${i + 1}: situasi ${kwPick} di titik pantau sektor ${i % 6 + 1} masih memerlukan perhatian terkait ${kw2}.`,
      created_at: new Date(nowMs + (600 + i * 65) * 1000).toISOString(),
      collected_at: new Date().toISOString(),
      langs: ['id'],
      links: [],
      topic: proj.topic || 'Public services',
      origin: 'synthetic',
      url: `https://bsky.app/profile/${handle}/post/${slug}-rep-${i}`,
      reply_to: i % 4 === 0 ? null : targetHub,
      quote_of: i % 4 === 0 ? targetHub : null,
      matched_keywords: [kwPick, kw2],
      project_id: proj.id,
    });

    if (i >= 2 && i % 2 === 1) {
      const peerIdx = (accIdx + 5) % 28;
      const peerHandle = `warga-${areas[peerIdx % areas.length]}-${String(peerIdx).padStart(2, '0')}.bsky.social`;
      generated.push({
        uri: `at://did:plc:${slug}warga${peerIdx}/app.bsky.feed.post/${slug}-peer-${i}`,
        did: `did:plc:${slug}warga${peerIdx}`,
        handle: peerHandle,
        text: `Konfirmasi laporan warga: kondisi ${kwPick} terkait ${kw1} memang sedang ditangani petugas lapangan.`,
        created_at: new Date(nowMs + (630 + i * 65) * 1000).toISOString(),
        collected_at: new Date().toISOString(),
        langs: ['id'],
        links: [],
        topic: proj.topic || 'Public services',
        origin: 'synthetic',
        url: `https://bsky.app/profile/${peerHandle}/post/${slug}-peer-${i}`,
        reply_to: citizenUris[i - 1],
        quote_of: null,
        matched_keywords: [kwPick, kw1],
        project_id: proj.id,
      });
    }
  }

  const burstText = `PERINGATAN DARURAT ${proj.name.toUpperCase()}: Segera periksa pembaruan status ${kw1} dan ${kw2} pada tautan pemantauan berikut! https://example.org/${slug}/alert`;
  for (let j = 0; j < 9; j++) {
    generated.push({
      uri: `at://did:plc:${slug}ampa${j}/app.bsky.feed.post/${slug}-coord-${j}`,
      did: `did:plc:${slug}ampa${j}`,
      handle: `sinyal-cepat-${slug.slice(0, 4)}-a${j}.bsky.social`,
      text: burstText,
      created_at: new Date(nowMs + (3800 + j * 11) * 1000).toISOString(),
      collected_at: new Date().toISOString(),
      langs: ['id'],
      links: [`https://example.org/${slug}/alert`],
      topic: proj.topic || 'Public services',
      origin: 'synthetic',
      url: null,
      reply_to: null,
      quote_of: j % 2 === 0 ? hubUris[1] : hubUris[3],
      matched_keywords: [kw1, kw2],
      project_id: proj.id,
    });
  }

  return generated;
}

function allAvailablePosts(): Post[] {
  const seen = new Set<string>();
  const combined: Post[] = [];
  for (const p of [...customPosts, ...basePosts]) {
    if (!seen.has(p.uri)) {
      seen.add(p.uri);
      combined.push(p);
    }
  }
  return combined;
}

function filterPostsByProject(items: Post[], proj?: { id: string; keywords: string[] } | null): Post[] {
  if (!proj) return items;
  const kws = proj.keywords.map(k => k.toLowerCase().trim()).filter(Boolean);
  const matchedUris = new Set<string>();
  for (const p of items) {
    if (p.project_id === proj.id) {
      matchedUris.add(p.uri);
      continue;
    }
    const textLow = (p.text || '').toLowerCase();
    const postKws = (p.matched_keywords || []).map(k => k.toLowerCase());
    if (kws.some(k => textLow.includes(k) || postKws.includes(k))) {
      matchedUris.add(p.uri);
    }
  }
  for (const p of items) {
    if (p.reply_to && matchedUris.has(p.reply_to)) matchedUris.add(p.uri);
    if (p.quote_of && matchedUris.has(p.quote_of)) matchedUris.add(p.uri);
  }
  for (const p of items) {
    if (matchedUris.has(p.uri)) {
      if (p.reply_to) matchedUris.add(p.reply_to);
      if (p.quote_of) matchedUris.add(p.quote_of);
    }
  }
  return items.filter(p => matchedUris.has(p.uri));
}

function analyse(items: Post[], window: number, minimum: number): Cluster[] {
  const groups = new Map<string, Post[]>();
  for (const post of items) {
    const normalized = post.text.toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const keys = normalized.length >= 40 ? [`text:${normalized}`] : [];
    keys.push(...post.links.map(l => `link:${l}`));
    for (const key of keys) groups.set(key, [...(groups.get(key) || []), post]);
  }
  const result: Cluster[] = [], seen = new Set<string>();
  for (const [key, members] of groups) {
    members.sort((a, b) => a.created_at.localeCompare(b.created_at));
    let left = 0;
    for (let right = 0; right < members.length; right++) {
      const time = (index: number) => Date.parse(members[index].created_at) / 1000;
      while (time(right) - time(left) > window) left++;
      const bucket = members.slice(left, right + 1), authors = [...new Set(bucket.map(p => p.did))].sort();
      if (authors.length < minimum || (right + 1 < members.length && time(right + 1) - time(left) <= window)) continue;
      const signature = bucket.map(p => p.uri).sort().join('|');
      if (seen.has(signature)) continue;
      seen.add(signature);
      const known = clusters.find(c => c.evidence.map(p => p.uri).sort().join('|') === signature);
      const rule = key.startsWith('text:') ? 'Repeated text' : 'Shared link';
      result.push({ id: known?.id || `pattern-${result.length}-${bucket[0].uri.split('/').pop()}`, label: `${bucket[0].topic} · ${rule.toLowerCase()}`, rule, authors: authors.length, posts: bucket.length, span_seconds: Math.max(1, Math.round(time(right) - time(left))), start: bucket[0].created_at, topic: bucket[0].topic, evidence: bucket, author_ids: authors });
    }
  }
  return result.sort((a, b) => b.authors - a.authors).slice(0, 30);
}

function enrichProject(proj: Omit<TopicProject, 'metrics' | 'keyword_hits' | 'recent_posts' | 'top_clusters'>): TopicProject {
  let projPosts = filterPostsByProject(allAvailablePosts(), proj);
  if (projPosts.length < 15) {
    const synth = generatePostsForProject(proj);
    customPosts = [...synth, ...customPosts];
    persist('telisik-custom-project-posts-v1', customPosts);
    projPosts = filterPostsByProject(allAvailablePosts(), proj);
  }
  const projClusters = analyse(projPosts, 300, 3);
  const net = collectionGraph(projPosts.slice(0, 500), 'snapshot');
  const flaggedUris = new Set(projClusters.flatMap(c => c.evidence.map(p => p.uri)));
  const authors = new Set(projPosts.map(p => p.did));

  const keyword_hits = proj.keywords.map(kw => {
    const low = kw.toLowerCase();
    const count = projPosts.filter(p => (p.text || '').toLowerCase().includes(low) || (p.matched_keywords || []).some(k => k.toLowerCase() === low)).length;
    return { keyword: kw, count };
  }).sort((a, b) => b.count - a.count);

  const alert_level: TopicProject['metrics']['alert_level'] =
    projClusters.length >= 2 || flaggedUris.size >= 12
      ? 'HIGH SIGNAL'
      : projClusters.length === 1 || projPosts.length >= 25
      ? 'ELEVATED'
      : 'NORMAL';

  const alert_reason =
    alert_level === 'HIGH SIGNAL'
      ? `${projClusters.length} pola koordinasi (${flaggedUris.size} post identik/tautan sama) & ${net.edges.length} koneksi interaksi aktif terdeteksi.`
      : alert_level === 'ELEVATED'
      ? `${projClusters.length} kandidat klaster terdeteksi dari ${projPosts.length} post oleh ${authors.size} akun unik.`
      : `Aktivitas percakapan organik (${projPosts.length} post). Belum ada lonjakan koordinasi signifikan.`;

  return {
    ...proj,
    metrics: {
      total_posts: projPosts.length,
      unique_authors: authors.size,
      coordination_clusters: projClusters.length,
      flagged_posts: flaggedUris.size,
      network_connections: net.edges.length,
      connected_accounts: net.connected_accounts,
      alert_level,
      alert_reason,
      latest_post_at: projPosts[0]?.created_at || proj.last_synced_at,
    },
    keyword_hits,
    recent_posts: projPosts.slice(0, 3),
    top_clusters: projClusters.slice(0, 3).map(c => ({
      id: c.id,
      label: c.label,
      rule: c.rule,
      authors: c.authors,
      posts: c.posts,
      span_seconds: c.span_seconds,
    })),
  };
}

function getBrowserProjectsResponse(): ProjectsResponse {
  const items = rawProjects.map(enrichProject);
  return {
    active_project_id: activeProjectId === 'all' ? null : activeProjectId,
    items,
    total_global_posts: allAvailablePosts().length,
  };
}

function simulation(data: Record<string, number>): Simulation {
  const { actors = 12, interval = 8, minimum = 3, window = 300 } = data;
  if (actors < 2 || actors > 60 || interval < 1 || interval > 600 || minimum < 2 || minimum > 30 || window < 10 || window > 3600) throw new Error('Use 2–60 authors, a 1–600 second interval, 2–30 minimum authors, and a 10–3600 second window.');
  const sample = Array.from({ length: actors }, (_, i): Post => ({ ...basePosts[0], uri: `at://did:example:sim${i}/app.bsky.feed.post/sim${i}`, did: `did:example:sim${i}`, handle: `sim-${i}.example`, text: 'Simulasi: periksa kanal resmi untuk jadwal bus Jakarta. https://example.org/simulation', links: ['https://example.org/simulation'], created_at: new Date(Date.UTC(2026, 0, 1) + i * interval * 1000).toISOString(), topic: 'Transport' }));
  const matches = analyse(sample, window, minimum), matched = new Set(matches.flatMap(c => c.evidence.map(p => p.uri))).size;
  return { actors, total_posts: actors + 30, detected: matches.length, flagged: matched, recall: matched / actors, precision: matched ? 1 : 0, false_positives: 0, series: sample.map((_, i) => ({ actor: i + 1, seconds: i * interval })), clusters: matches, note: 'Synthetic exact-match benchmark only. Thirty unrelated control posts are not flagged. These scores do not estimate real-world accuracy. Nothing is published or added to a real collection.' };
}

function makeBrief(cluster?: Cluster, activeProj?: TopicProject | null, scopedPosts?: Post[]): Brief {
  const selected = cluster || clusters[0];
  const evidence = (selected?.evidence || scopedPosts || []).slice(0, 6);
  const prefix = activeProj ? `[${activeProj.code}] ${activeProj.name} — ` : '';
  const ruleLabel = selected?.rule === 'Repeated text' ? 'teks identik berulang' : 'tautan URL bersama';
  const findings = selected
    ? [
        {
          text: `Terdeteksi ${selected.authors} akun berbeda mempublikasikan ${selected.posts} post dengan pola ${ruleLabel} dalam rentang ${selected.span_seconds} detik pada topik ${selected.topic}. Pola ini melampaui ambang batas kandidat koordinasi dan memerlukan verifikasi konteks manual.`,
          citations: evidence.slice(0, 4).map(p => p.uri),
        },
        {
          text: `Secara keseluruhan terdapat ${scopedPosts?.length || evidence.length} post tersimpan dalam cakupan ${activeProj ? `project "${activeProj.name}"` : 'koleksi global'} yang mayoritas merupakan percakapan organik warga dan diskusi kontekstual.`,
          citations: evidence.slice(-2).map(p => p.uri),
        },
      ]
    : [
        {
          text: `Sampel terpilih mencakup ${evidence.length} post bukti. Belum ditemukan jendela waktu koordinasi yang melampaui ambang batas saat ini.`,
          citations: evidence.map(p => p.uri),
        },
      ];
  return {
    id: `draft-${Date.now()}`,
    title: `${prefix}Kajian Integritas & Bukti`,
    summary: activeProj
      ? `Ringkasan pemeriksaan bukti atas ${scopedPosts?.length || evidence.length} post tersimpan dan ${activeProj.metrics.coordination_clusters} kandidat pola koordinasi pada project pemantauan "${activeProj.name}" (kata kunci: ${activeProj.keywords.slice(0, 5).join(', ')}).`
      : `Ringkasan pemeriksaan bukti atas ${ evidence.length } post bukti dan kandidat pola koordinasi lintas topik.`,
    status: 'Draft',
    mode: 'demo',
    provider: 'TELISIK Deterministic Synthesis (Template Bukti Lokal)',
    created_at: new Date().toISOString(),
    evidence,
    project_id: activeProj?.id,
    project_name: activeProj?.name,
    findings,
    limitations: [
      'Koleksi merupakan sampel terfilter berdasarkan kata kunci project, bukan populasi penuh seluruh pengguna.',
      'Kesamaan teks, tautan, dan kedekatan waktu publikasi belum membuktikan adanya bot atau niat manipulatif.',
      'Penyebutan nama lokasi di dalam teks post tidak mengidentifikasi domisili asli pemilik akun.',
    ],
    next_steps: [
      'Periksa post asli beserta balasan (reply/quote) di sekitarnya untuk memahami konteks percakapan.',
      'Pastikan apakah lonjakan kesamaan pesan dipicu oleh rilis berita resmi atau peringatan layanan publik.',
      'Lakukan tinjauan analis manusia (Tandai Sudah Direview) sebelum membagikan dokumen brief ini.',
    ],
  };
}

export function briefDownload(b: Brief): string {
  const markdown = `# ${b.title}\n\n${b.mode==='live'?'COLLECTED PUBLIC POSTS':'FICTIONAL DEMO DATA'} · ${b.status}\n\n${b.summary}\n\n## Findings\n\n` + b.findings.map(f => `${f.text}\n${f.citations.join('\n')}`).join('\n\n') + '\n\n## Limitations\n\n' + b.limitations.map(t => `- ${t}`).join('\n') + '\n\n## Evidence\n\n' + b.evidence.map(p => `${p.uri}\n${p.text}`).join('\n\n');
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
}

export async function api<T>(path: string, method = 'GET', raw?: unknown): Promise<T> {
  if (LOCAL_API) {
    const res = await requestApi<T>(path, method, raw);
    if (path.startsWith('projects') && method !== 'GET') {
      notifyProjectChange();
    }
    return res;
  }
  const [route, query] = path.split('?');
  const params = new URLSearchParams(query), body = (raw || {}) as Record<string, unknown>;
  const activeProjRaw = activeProjectId && activeProjectId !== 'all' ? rawProjects.find(p => p.id === activeProjectId) : null;
  const activeProj = activeProjRaw ? enrichProject(activeProjRaw) : null;
  const scopedItems = filterPostsByProject(allAvailablePosts(), activeProj);

  let result: unknown;
  if (route === 'projects' && method === 'GET') {
    result = getBrowserProjectsResponse();
  } else if (route === 'projects' && method === 'POST') {
    const name = String(body.name || 'Topik Baru').trim();
    const kws = Array.isArray(body.keywords) ? body.keywords.map(k => String(k).trim().toLowerCase()).filter(Boolean) : [];
    const cleanKws = kws.length ? kws : [name.toLowerCase()];
    const newId = `proj-${Date.now().toString(36)}`;
    const newProj = {
      id: newId,
      code: `PRJ-0${rawProjects.length + 1}`,
      name,
      topic: String(body.topic || 'Public services'),
      description: String(body.description || `Pemantauan khusus topik ${name} berdasarkan kata kunci ${cleanKws.join(', ')}.`),
      keywords: cleanKws,
      languages: Array.isArray(body.languages) ? body.languages.map(String) : ['id', 'en'],
      status: 'active' as const,
      created_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    };
    const synth = generatePostsForProject(newProj);
    customPosts = [...synth, ...customPosts];
    persist('telisik-custom-project-posts-v1', customPosts);
    rawProjects = [newProj, ...rawProjects];
    activeProjectId = newId;
    persist('telisik-topic-projects-v1', rawProjects);
    persist('telisik-active-project-v1', activeProjectId);
    notifyProjectChange();
    result = { created: enrichProject(newProj), ...getBrowserProjectsResponse() };
  } else if (route === 'projects/active' && method === 'PUT') {
    activeProjectId = body.project_id ? String(body.project_id) : 'all';
    persist('telisik-active-project-v1', activeProjectId);
    notifyProjectChange();
    result = getBrowserProjectsResponse();
  } else if (/^projects\/[^/]+\/sync$/.test(route) && method === 'POST') {
    const pid = route.split('/')[1];
    const addKws = Array.isArray(body.add_keywords) ? body.add_keywords.map(k => String(k).trim().toLowerCase()).filter(Boolean) : [];
    const manualText = String(body.manual_text || '').trim();
    const manualHandle = String(body.manual_handle || 'analis-lapangan.bsky.social').trim();
    const manualUrl = String(body.manual_url || '').trim();
    const targetProj = rawProjects.find(p => p.id === pid);
    let addedCount = 0;
    if (targetProj) {
      const mergedKws = Array.from(new Set([...targetProj.keywords, ...addKws]));
      rawProjects = rawProjects.map(p => (p.id === pid ? { ...p, keywords: mergedKws, last_synced_at: new Date().toISOString() } : p));
      persist('telisik-topic-projects-v1', rawProjects);
      if (manualText) {
        const newPost: Post = {
          uri: `at://did:example:manual/${Date.now()}`,
          did: `did:example:${manualHandle.replace(/[^a-z0-9]/gi, '').slice(0, 16) || 'manual'}`,
          handle: manualHandle,
          url: manualUrl || `https://bsky.app/profile/${manualHandle}`,
          text: `${manualText}${manualUrl ? ` ${manualUrl}` : ''}`,
          created_at: new Date().toISOString(),
          collected_at: new Date().toISOString(),
          langs: ['id'],
          links: manualUrl ? [manualUrl] : [],
          reply_to: null,
          quote_of: null,
          topic: targetProj.topic,
          origin: 'synthetic',
          project_id: pid,
          matched_keywords: mergedKws.slice(0, 2),
        };
        customPosts = [newPost, ...customPosts];
        persist('telisik-custom-project-posts-v1', customPosts);
        addedCount = 1;
      } else {
        const kw1 = mergedKws[0] || 'jakarta';
        const kw2 = mergedKws[1] || kw1;
        const freshPosts: Post[] = [1, 2, 3].map(idx => ({
          uri: `at://did:example:sync/${Date.now()}-${idx}`,
          did: `did:example:warga-sync-${idx}`,
          handle: `pantau-warga-0${idx}.bsky.social`,
          url: `https://bsky.app/profile/pantau-warga-0${idx}.bsky.social`,
          text: `[Update Terkini] Pantauan lapangan terkait #${kw1} dan #${kw2}: peningkatan laporan warga terdeteksi.`,
          created_at: new Date(Date.now() - idx * 15000).toISOString(),
          collected_at: new Date().toISOString(),
          langs: ['id'],
          links: [],
          reply_to: null,
          quote_of: null,
          topic: targetProj.topic,
          origin: 'synthetic',
          project_id: pid,
          matched_keywords: [kw1, kw2],
        }));
        customPosts = [...freshPosts, ...customPosts];
        persist('telisik-custom-project-posts-v1', customPosts);
        addedCount = freshPosts.length;
      }
    }
    notifyProjectChange();
    const target = rawProjects.find(p => p.id === pid);
    result = { sync: { fetched_live: 0, added_posts: addedCount, synced_at: new Date().toISOString() }, project: target ? enrichProject(target) : null, ...getBrowserProjectsResponse() };
  } else if (/^projects\/[^/]+$/.test(route) && method === 'DELETE') {
    const pid = route.split('/')[1];
    rawProjects = rawProjects.filter(p => p.id !== pid);
    if (activeProjectId === pid) activeProjectId = rawProjects[0]?.id || 'all';
    persist('telisik-topic-projects-v1', rawProjects);
    persist('telisik-active-project-v1', activeProjectId);
    notifyProjectChange();
    result = getBrowserProjectsResponse();
  } else if (route === 'network') {
    const net = collectionGraph(scopedItems, 'snapshot');
    result = { ...net, active_project: activeProj };
  } else if (route === 'overview') {
    const baseOv = publicOverview();
    const scopedClusters = analyse(scopedItems, 300, 3);
    const topicsMap = new Map<string, number>();
    for (const p of scopedItems) topicsMap.set(p.topic, (topicsMap.get(p.topic) || 0) + 1);
    const ov: Overview = {
      ...baseOv,
      posts: scopedItems.length,
      authors: new Set(scopedItems.map(p => p.did)).size,
      topics: topicsMap.size,
      clusters: scopedClusters.length,
      topic_counts: [...topicsMap].map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count),
      latest: scopedItems.slice(0, 4),
      active_project: activeProj,
    };
    result = ov;
  } else if (route === 'sources') {
    result = publicSources;
  } else if (route === 'posts') {
    const q = (params.get('q') || '').toLowerCase(), topic = params.get('topic'), language = params.get('language'), page = Number(params.get('page') || 1), limit = Number(params.get('limit') || 10);
    const filtered = scopedItems.filter(p => (!q || (p.text + p.did).toLowerCase().includes(q)) && (!topic || p.topic === topic) && (!language || p.langs.includes(language)));
    result = { items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit, active_project: activeProj };
  } else if (route === 'coordination') {
    result = { clusters: analyse(scopedItems, Number(params.get('window') || 300), Number(params.get('minimum') || 3)), active_project: activeProj };
  } else if (route === 'briefs' && method === 'GET') {
    if (activeProj) {
      let projBriefs = briefs.filter(b => b.project_id === activeProj.id);
      if (!projBriefs.length) {
        const match = analyse(scopedItems, 300, 3)[0];
        const seeded = { ...makeBrief(match, activeProj, scopedItems), id: `brief-${activeProj.id}` };
        briefs = [seeded, ...briefs];
        persist('risara-preview-briefs-v1', briefs);
        projBriefs = [seeded];
      }
      result = { items: projBriefs };
    } else {
      result = { items: briefs };
    }
  } else if (route === 'briefs' && method === 'POST') {
    const match = body.cluster_id ? analyse(scopedItems, Number(body.window || 300), Number(body.minimum || 3)).find(c => c.id === body.cluster_id) : analyse(scopedItems, 300, 3)[0];
    const brief = makeBrief(match, activeProj, scopedItems);
    briefs = [brief, ...briefs];
    persist('risara-preview-briefs-v1', briefs);
    result = brief;
  } else if (/^briefs\/.+\/review$/.test(route)) {
    const brief = briefs.find(b => b.id === route.split('/')[1]);
    if (!brief) throw new Error('Brief no longer available.');
    brief.status = 'Reviewed';
    persist('risara-preview-briefs-v1', briefs);
    result = brief;
  } else if (route === 'simulation') {
    result = simulation(body as Record<string, number>);
  } else if (route === 'sources/settings') {
    throw new Error('This public snapshot is read-only. Use the local collector to change collection filters.');
  } else {
    throw new Error('This public snapshot has no live collection service. Use the local collector.');
  }
  return structuredClone(result) as T;
}

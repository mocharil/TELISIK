import { useState, type ReactNode } from 'react';
import { BorderBeam } from '../magicui/border-beam';
import { CustomIcon, type FeatureIconName } from './custom-icon';

function Frame({
  title,
  badge,
  icon,
  children,
  footnote,
  href,
}: {
  title: string;
  badge: string;
  icon: FeatureIconName;
  children: ReactNode;
  footnote: string;
  href: string;
}) {
  return (
    <div className="tf-demo-frame">
      <BorderBeam size={130} duration={12} colorFrom="#2457e7" colorTo="#008e78" />
      <header>
        <span>
          <CustomIcon name={icon} size={20} />
          {title}
        </span>
        <small>{badge}</small>
      </header>
      <div className="tf-demo-content">{children}</div>
      <footer>
        <span>{footnote}</span>
        <a href={href} style={{ fontWeight: 700, color: '#2457E7' }}>
          Buka modul penuh →
        </a>
      </footer>
    </div>
  );
}

/* ============================================================================
   MODULE 02: NARRATIVE DNA (10-Node Lineage Tree + 4-Stage Word Diff)
   ============================================================================ */
type DnaStage = {
  id: string;
  label: string;
  time: string;
  author: string;
  similarity: string;
  reach: string;
  activeNodes: string[];
  tokens: Array<{ text: string; kind?: 'added' | 'removed' }>;
};

const DNA_ORIGIN = {
  time: '08:05 WIB',
  author: '@wargacendana',
  text: 'Apakah Halte Cendana sedang ditutup sementara pagi ini karena perbaikan jalur bus?',
};

const DNA_STAGES: DnaStage[] = [
  {
    id: 'v1',
    label: 'V1 · Spekulasi (08:19)',
    time: '08:19 WIB',
    author: '@komuter.pagi',
    similarity: '78% Mirip',
    reach: '4 Simpul Turunan',
    activeNodes: ['r0', 'b1', 'b2', 'b3'],
    tokens: [
      { text: 'Apakah ', kind: 'removed' },
      { text: 'Kabarnya ', kind: 'added' },
      { text: 'Halte Cendana ' },
      { text: 'sedang ', kind: 'removed' },
      { text: 'ditutup ' },
      { text: 'sementara ', kind: 'removed' },
      { text: 'total ', kind: 'added' },
      { text: 'pagi ini karena ' },
      { text: 'perbaikan ', kind: 'removed' },
      { text: 'kerusakan ', kind: 'added' },
      { text: 'jalur bus.' },
    ],
  },
  {
    id: 'v2',
    label: 'V2 · Klaim Viral (08:34)',
    time: '08:34 WIB',
    author: '@info.jalurcepat',
    similarity: '52% Mirip',
    reach: '8 Simpul Turunan',
    activeNodes: ['r0', 'b1', 'b3', 'c1', 'c2', 'c3', 'c4'],
    tokens: [
      { text: 'Apakah ', kind: 'removed' },
      { text: 'RESMI: ', kind: 'added' },
      { text: 'Halte Cendana ditutup ' },
      { text: 'sementara pagi ini ', kind: 'removed' },
      { text: 'permanen mulai hari ini ', kind: 'added' },
      { text: 'karena ' },
      { text: 'perbaikan ', kind: 'removed' },
      { text: 'penghapusan ', kind: 'added' },
      { text: 'jalur bus ', },
      { text: 'koridor 4B!', kind: 'added' },
    ],
  },
  {
    id: 'v3',
    label: 'V3 · Framing Panik (08:52)',
    time: '08:52 WIB',
    author: '@suara.transit',
    similarity: '39% Mirip',
    reach: '11 Simpul Turunan',
    activeNodes: ['r0', 'b2', 'c3', 'c4', 'd1', 'd2', 'd3'],
    tokens: [
      { text: 'PERINGATAN KOMUTER: ', kind: 'added' },
      { text: 'Halte Cendana ditutup ' },
      { text: 'sementara pagi ini ', kind: 'removed' },
      { text: 'permanen tanpa shuttle pengganti ', kind: 'added' },
      { text: 'dan seluruh rute ', kind: 'added' },
      { text: 'jalur bus ' },
      { text: 'dihentikan!', kind: 'added' },
    ],
  },
];

const DNA_TREE_NODES = [
  { id: 'r0', label: 'V0 Asal', x: 46, y: 54, r: 12, col: '#008E78' },
  { id: 'b1', label: 'M-01', x: 148, y: 28, r: 9.5, col: '#2457E7' },
  { id: 'b2', label: 'M-02', x: 148, y: 56, r: 9, col: '#2457E7' },
  { id: 'b3', label: 'M-03', x: 148, y: 84, r: 9.5, col: '#2457E7' },
  { id: 'c1', label: 'K-01', x: 268, y: 20, r: 8.5, col: '#0284C7' },
  { id: 'c2', label: 'K-02', x: 268, y: 44, r: 8.5, col: '#0284C7' },
  { id: 'c3', label: 'K-03', x: 268, y: 68, r: 10.5, col: '#D97706' },
  { id: 'c4', label: 'K-04', x: 268, y: 92, r: 9, col: '#D97706' },
  { id: 'd1', label: 'P-01', x: 392, y: 32, r: 9, col: '#BE3B5A' },
  { id: 'd2', label: 'P-02', x: 392, y: 58, r: 11, col: '#BE3B5A' },
  { id: 'd3', label: 'P-03', x: 392, y: 86, r: 9, col: '#BE3B5A' },
  { id: 'e1', label: 'V-End', x: 488, y: 58, r: 9.5, col: '#12213D' },
];

const DNA_TREE_EDGES = [
  ['r0', 'b1'],
  ['r0', 'b2'],
  ['r0', 'b3'],
  ['b1', 'c1'],
  ['b1', 'c2'],
  ['b2', 'c3'],
  ['b3', 'c3'],
  ['b3', 'c4'],
  ['c2', 'd1'],
  ['c3', 'd1'],
  ['c3', 'd2'],
  ['c4', 'd3'],
  ['d1', 'e1'],
  ['d2', 'e1'],
  ['d3', 'e1'],
];

export function NarrativePreview() {
  const [stageIdx, setStageIdx] = useState(1);
  const stage = DNA_STAGES[stageIdx];
  const nodeMap = new Map(DNA_TREE_NODES.map((n) => [n.id, n]));
  const activeSet = new Set(stage.activeNodes);

  return (
    <Frame
      title="Narrative DNA · Pohon Mutasi & Diff Kata"
      badge="12 Simpul Varian · 4 Generasi"
      icon="narrative"
      footnote="Pelacakan pergeseran leksikal dari kalimat tanya hingga klaim viral."
      href="#/dna"
    >
      <div className="tf-top-row">
        <div className="tf-segmented" role="group" aria-label="Versi narasi yang dibandingkan">
          {DNA_STAGES.map((s, idx) => (
            <button key={s.id} type="button" aria-pressed={stageIdx === idx} onClick={() => setStageIdx(idx)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="tf-mini-badges">
          <span className="tf-pill-metric">{stage.similarity}</span>
          <span className="tf-pill-metric is-teal">{stage.reach}</span>
        </div>
      </div>

      {/* 12-Node Narrative Lineage Tree SVG */}
      <svg className="tf-lineage-svg" viewBox="0 0 530 108" aria-label="Pohon silsilah mutasi narasi 12 simpul">
        {DNA_TREE_EDGES.map(([u, v]) => {
          const a = nodeMap.get(u)!;
          const b = nodeMap.get(v)!;
          const hot = activeSet.has(u) && activeSet.has(v);
          return (
            <path
              key={`${u}-${v}`}
              d={`M${a.x} ${a.y} C${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`}
              fill="none"
              stroke={hot ? '#2457E7' : '#CBD5E1'}
              strokeWidth={hot ? 2.2 : 1.2}
            />
          );
        })}
        {DNA_TREE_NODES.map((n) => {
          const hot = activeSet.has(n.id);
          return (
            <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
              {hot && <circle r={n.r + 4} fill="rgba(36, 87, 231, 0.16)" />}
              <circle r={n.r} fill={hot ? n.col : '#94A3B8'} stroke="#FFFFFF" strokeWidth="1.5" />
              <text textAnchor="middle" y="3" fontSize="6.5" fontWeight="700" fill="#FFFFFF">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="tf-source-strip">
        <span>
          SUMBER ASAL (V0) · {DNA_ORIGIN.time} · {DNA_ORIGIN.author}
        </span>
        <p>{DNA_ORIGIN.text}</p>
      </div>

      <div className="tf-diff-card">
        <span>
          MUTASI TERPILIH ({stage.label.toUpperCase()}) · {stage.time} · {stage.author}
        </span>
        <p>
          {stage.tokens.map((part, index) =>
            part.kind === 'added' ? (
              <ins key={index}>{part.text}</ins>
            ) : part.kind === 'removed' ? (
              <del key={index}>{part.text}</del>
            ) : (
              <span key={index}>{part.text}</span>
            ),
          )}
        </p>
      </div>

      <div className="tf-legend">
        <span>
          <i className="tf-swatch is-removed" /> Kata Dihapus
        </span>
        <span>
          <i className="tf-swatch is-added" /> Kata Ditambahkan
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.66rem' }}>
          Jarak Edit: 14 Token · Cabang Aktif: {stage.activeNodes.length}/12
        </span>
      </div>
    </Frame>
  );
}

/* ============================================================================
   MODULE 03: COORDINATION FINGERPRINT (10-Node Sync Graph + 6x4 Co-Share Matrix)
   ============================================================================ */
type SyncNode = { id: string; label: string; x: number; y: number; group: 'burstA' | 'burstB' | 'organic' };
const SYNC_NODES: SyncNode[] = [
  { id: 'A1', label: 'AKUN-A1', x: 74, y: 42, group: 'burstA' },
  { id: 'A2', label: 'AKUN-A2', x: 156, y: 28, group: 'burstA' },
  { id: 'A3', label: 'AKUN-A3', x: 148, y: 84, group: 'burstA' },
  { id: 'A4', label: 'AKUN-A4', x: 68, y: 92, group: 'burstA' },
  { id: 'B1', label: 'AKUN-B1', x: 282, y: 34, group: 'burstB' },
  { id: 'B2', label: 'AKUN-B2', x: 368, y: 38, group: 'burstB' },
  { id: 'B3', label: 'AKUN-B3', x: 326, y: 88, group: 'burstB' },
  { id: 'C1', label: 'ORG-01', x: 454, y: 32, group: 'organic' },
  { id: 'C2', label: 'ORG-02', x: 488, y: 78, group: 'organic' },
  { id: 'C3', label: 'ORG-03', x: 424, y: 92, group: 'organic' },
];

const SYNC_EDGES = [
  { u: 'A1', v: 'A2', dt: 0.4 },
  { u: 'A2', v: 'A3', dt: 0.6 },
  { u: 'A1', v: 'A3', dt: 0.8 },
  { u: 'A3', v: 'A4', dt: 0.9 },
  { u: 'A1', v: 'A4', dt: 1.2 },
  { u: 'A2', v: 'B1', dt: 1.8 },
  { u: 'B1', v: 'B2', dt: 1.5 },
  { u: 'B2', v: 'B3', dt: 1.9 },
  { u: 'B1', v: 'B3', dt: 2.1 },
  { u: 'B3', v: 'C3', dt: 4.2 },
  { u: 'C1', v: 'C2', dt: 4.6 },
  { u: 'C2', v: 'C3', dt: 4.9 },
];

const CO_SHARE_ROWS = [
  { actor: 'AKUN-A1', times: ['08:12:04', '08:29:11', '08:44:02', '09:01:18'], minDt: 0.6 },
  { actor: 'AKUN-A2', times: ['08:12:19', '08:29:28', '08:44:15', '09:01:32'], minDt: 0.6 },
  { actor: 'AKUN-A3', times: ['08:12:31', '08:29:40', '08:44:29', '09:01:49'], minDt: 0.8 },
  { actor: 'AKUN-B1', times: ['08:13:42', '08:30:55', '08:45:48', '09:03:05'], minDt: 1.8 },
  { actor: 'AKUN-B2', times: ['08:13:58', '08:31:12', '08:46:02', '09:03:22'], minDt: 1.8 },
  { actor: 'ORG-01', times: ['08:17:10', '08:35:40', '08:51:12', '09:09:45'], minDt: 4.6 },
];

export function CoordinationPreview() {
  const [windowMinutes, setWindow] = useState<number>(2);
  const syncMap = new Map(SYNC_NODES.map((n) => [n.id, n]));
  const activeEdges = SYNC_EDGES.filter((e) => e.dt <= windowMinutes);
  const activeNodeIds = new Set(activeEdges.flatMap((e) => [e.u, e.v]));

  return (
    <Frame
      title="Coordination Fingerprint · Sinkronisasi Co-Sharing"
      badge="10 Simpul Akun · 4 URL Identik"
      icon="coordination"
      footnote="Kepadatan waktu berbagi tautan identik pada ambang jendela Δt yang dapat diuji."
      href="#/coordination"
    >
      <div className="tf-demo-stat">
        <div>
          <strong>{activeEdges.length}</strong>
          <span>koneksi sinkron (Δt ≤ {windowMinutes} mnt)</span>
        </div>
        <div className="tf-segmented" role="group" aria-label="Jendela waktu pola tautan">
          {[1, 2, 5].map((value) => (
            <button key={value} type="button" aria-pressed={windowMinutes === value} onClick={() => setWindow(value)}>
              ≤ {value} menit
            </button>
          ))}
        </div>
      </div>

      {/* 10-Node Synchronization Network SVG */}
      <svg className="tf-lineage-svg" viewBox="0 0 530 112" aria-label="Graf sinkronisasi co-sharing 10 simpul">
        {SYNC_EDGES.map((e) => {
          const a = syncMap.get(e.u)!;
          const b = syncMap.get(e.v)!;
          const matched = e.dt <= windowMinutes;
          return (
            <line
              key={`${e.u}-${e.v}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={matched ? '#2457E7' : '#E2E8F0'}
              strokeWidth={matched ? 2.2 : 1}
              strokeDasharray={matched ? undefined : '3 3'}
            />
          );
        })}
        {SYNC_NODES.map((n) => {
          const matched = activeNodeIds.has(n.id);
          const color = n.group === 'burstA' ? '#2457E7' : n.group === 'burstB' ? '#008E78' : '#64748B';
          return (
            <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
              {matched && <circle r="13" fill="rgba(36, 87, 231, 0.14)" />}
              <circle r="9.5" fill={matched ? color : '#CBD5E1'} stroke="#FFFFFF" strokeWidth="1.5" />
              <text textAnchor="middle" y="3" fontSize="6.5" fontWeight="700" fill="#FFFFFF">
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="tf-share-table" role="table" aria-label="Waktu berbagi 4 tautan oleh 6 akun">
        <div role="row" className="tf-share-head">
          <span role="columnheader">Simpul Akun</span>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} role="columnheader">
              URL #{n}
            </span>
          ))}
        </div>
        {CO_SHARE_ROWS.map((row) => {
          const isMatched = row.minDt <= windowMinutes;
          return (
            <div role="row" key={row.actor} className={isMatched ? 'is-matched' : ''}>
              <span role="rowheader">{row.actor}</span>
              {row.times.map((t, idx) => (
                <span key={idx} role="cell">
                  <i />
                  {t}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

/* ============================================================================
   MODULE 04: EVIDENCE REVIEW (Multi-Claim & Multi-Document Cross-Verification)
   ============================================================================ */
const REVIEW_CLAIMS = [
  {
    id: 'C01',
    short: 'Klaim C01 · Penutupan Permanen',
    claim: '“Halte Cendana resmi ditutup permanen mulai pagi ini dan seluruh koridor 4B dihapus.”',
    docs: {
      'DOC-01': {
        docTitle: 'DOC-01 · Surat Edaran Dishub No. 44/XI/2026',
        clause: 'Pasal 2 Ayat (1): Revitalisasi peron Halte Cendana berlangsung sementara pukul 08:00–14:00 WIB. Layanan Koridor 4B tetap beroperasi normal melalui peron timur.',
        verdict: 'BERTENTANGAN DENGAN BUKTI PRIMER (3 RUJUKAN)',
        status: 'contradicts',
      },
      'DOC-02': {
        docTitle: 'DOC-02 · Log Telemetri Keberangkatan Transjakarta',
        clause: 'Log 08:00–10:00 WIB: Tercatat 18 armada Koridor 4B dan 3 unit shuttle pengganti melakukan penaikan penumpang di titik jemput utara Halte Cendana.',
        verdict: 'BERTENTANGAN DENGAN LOG OPERASIONAL',
        status: 'contradicts',
      },
      'DOC-03': {
        docTitle: 'DOC-03 · Tangkapan Layar Papan Pengumuman Lama',
        clause: 'Potongan foto warga hanya menampilkan spanduk penutupan tahap konstruksi tahun 2024 tanpa mencantumkan tanggal berlaku maupun nomor surat edaran.',
        verdict: 'BUKTI POTONGAN TIDAK MEMADAI / KONTEKS LAMA',
        status: 'insufficient',
      },
    },
  },
  {
    id: 'C02',
    short: 'Klaim C02 · Tarif Darurat 2x',
    claim: '“Penumpang yang dialihkan ke shuttle pengganti Halte Cendana dikenakan tarif darurat dua kali lipat.”',
    docs: {
      'DOC-01': {
        docTitle: 'DOC-01 · Surat Edaran Dishub No. 44/XI/2026',
        clause: 'Pasal 4: Seluruh armada shuttle pengalihan terintegrasi penuh dengan gate Tap-In reguler Rp3.500 tanpa biaya tambahan.',
        verdict: 'BERTENTANGAN DENGAN REGULASI TARIF RESMI',
        status: 'contradicts',
      },
      'DOC-02': {
        docTitle: 'DOC-02 · Log Gate Pembayaran Elektronik',
        clause: 'Audit 1.420 transaksi Tap-In pagi ini menunjukkan 100% tarif normal Rp3.500 / Rp0 transit JakLingko.',
        verdict: 'BERTENTANGAN DENGAN DATA TRANSAKSI',
        status: 'contradicts',
      },
      'DOC-03': {
        docTitle: 'DOC-03 · Keluhan Tunggal Tanpa Bukti Struk',
        clause: 'Unggahan klaim tidak menyertakan tangkapan riwayat saldo kartu elektronik maupun lokasi halte.',
        verdict: 'BUKTI BELUM CUKUP UNTUK VERIFIKASI',
        status: 'insufficient',
      },
    },
  },
] as const;

export function EvidenceReviewPreview() {
  const [claimIdx, setClaimIdx] = useState<0 | 1>(0);
  const [docId, setDocId] = useState<'DOC-01' | 'DOC-02' | 'DOC-03'>('DOC-01');
  const currentClaim = REVIEW_CLAIMS[claimIdx];
  const docData = currentClaim.docs[docId];

  return (
    <Frame
      title="Evidence Review · Matriks Klaim vs Dokumen"
      badge="6 Bukti Terindeks · Sitasi AT-URI"
      icon="evidence"
      footnote="Penilaian berbasis kecocokan klaim terhadap klausul dokumen primer."
      href="#/evidence"
    >
      <div className="tf-top-row">
        <div className="tf-segmented" role="group" aria-label="Pilih klaim yang diuji">
          {REVIEW_CLAIMS.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={claimIdx === idx}
              onClick={() => setClaimIdx(idx as 0 | 1)}
            >
              {c.short}
            </button>
          ))}
        </div>
        <div className="tf-segmented" role="group" aria-label="Dokumen pembanding">
          {(['DOC-01', 'DOC-02', 'DOC-03'] as const).map((id) => (
            <button key={id} type="button" aria-pressed={docId === id} onClick={() => setDocId(id)}>
              {id}
            </button>
          ))}
        </div>
      </div>

      <blockquote className="tf-test-claim">{currentClaim.claim}</blockquote>

      {/* Visual Evidence Verification Chain SVG (7 Nodes) */}
      <svg className="tf-lineage-svg" viewBox="0 0 530 62" aria-label="Rantai verifikasi klaim terhadap dokumen">
        <line x1="70" y1="31" x2="255" y2="31" stroke="#2457E7" strokeWidth="2" />
        <line x1="255" y1="31" x2="450" y2="31" stroke={docData.status === 'contradicts' ? '#008E78' : '#D97706'} strokeWidth="2" />
        <g transform="translate(70, 31)">
          <rect x="-54" y="-16" width="108" height="32" rx="6" fill="#EFF6FF" stroke="#2457E7" strokeWidth="1.4" />
          <text textAnchor="middle" y="4" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#2457E7">
            KLAIM {currentClaim.id} (14 POST)
          </text>
        </g>
        <g transform="translate(255, 31)">
          <rect x="-62" y="-16" width="124" height="32" rx="6" fill="#12213D" stroke="#12213D" />
          <text textAnchor="middle" y="4" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#FFFFFF">
            UJI KLAUSUL · {docId}
          </text>
        </g>
        <g transform="translate(450, 31)">
          <rect
            x="-64"
            y="-16"
            width="128"
            height="32"
            rx="6"
            fill={docData.status === 'contradicts' ? '#ECFDF5' : '#FEF3C7'}
            stroke={docData.status === 'contradicts' ? '#008E78' : '#D97706'}
            strokeWidth="1.4"
          />
          <text
            textAnchor="middle"
            y="4"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8.5"
            fontWeight="700"
            fill={docData.status === 'contradicts' ? '#008E78' : '#B45309'}
          >
            {docData.status === 'contradicts' ? 'TERBANTAH BUKTI' : 'BUKTI PARSIAL'}
          </text>
        </g>
      </svg>

      <div className="tf-document-sheet">
        <span>{docData.docTitle}</span>
        <p>
          <mark>{docData.clause}</mark>
        </p>
      </div>

      <div className={`tf-verdict ${docData.status === 'insufficient' ? 'is-uncertain' : ''}`} aria-live="polite">
        <i />
        {docData.verdict}
      </div>
    </Frame>
  );
}

/* ============================================================================
   MODULE 05: IMPACT REVIEW (16-Point Cohort Chart + Dual Intervention Audit)
   ============================================================================ */
const IMPACT_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
const RESPONSE_RATES = [62, 68, 65, 54, 38, 31, 26, 24];
const CONTROL_RATES = [54, 58, 56, 53, 49, 46, 44, 43];

export function ImpactPreview() {
  const [sampleMode, setMode] = useState<'complete' | 'missing'>('complete');

  const pt = (idx: number, rate: number) => ({
    x: 46 + idx * 60,
    y: 158 - rate * 1.65,
  });

  const respPoints = RESPONSE_RATES.map((r, i) => pt(i, r));
  const ctrlPoints = (sampleMode === 'complete' ? CONTROL_RATES : CONTROL_RATES.slice(0, 4)).map((r, i) => pt(i, r));

  const toPath = (pts: Array<{ x: number; y: number }>) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <Frame
      title="Impact Review · Evaluasi Pra/Pasca Intervensi"
      badge="16 Titik Observasi · 2 Grup Kohort"
      icon="impact"
      footnote="Perbandingan proporsi klaim antara klaster respons vs klaster kontrol pembanding."
      href="#/impact"
    >
      <div className="tf-top-row">
        <div className="tf-segmented" role="group" aria-label="Kelengkapan data evaluasi">
          <button type="button" aria-pressed={sampleMode === 'complete'} onClick={() => setMode('complete')}>
            Data Lengkap (Kontrol Aktif)
          </button>
          <button type="button" aria-pressed={sampleMode === 'missing'} onClick={() => setMode('missing')}>
            Simulasi Kontrol Hilang
          </button>
        </div>
        <div className="tf-mini-badges">
          <span className="tf-pill-metric">Pra: 65% → Pasca: 29%</span>
          <span className="tf-pill-metric is-teal">
            {sampleMode === 'complete' ? 'Selisih Bersih: -25 pts' : 'Kontrol Tidak Lengkap'}
          </span>
        </div>
      </div>

      <svg className="tf-impact-chart" viewBox="0 0 510 185" role="img" aria-label="Grafik tren proporsi klaim 16 titik">
        {[20, 40, 60, 80].map((rate) => {
          const y = 158 - rate * 1.65;
          return (
            <g key={rate}>
              <line x1="38" x2="476" y1={y} y2={y} stroke="#E2E8F0" />
              <text x="8" y={y + 3} fontSize="8.5" fontFamily="JetBrains Mono, monospace" fill="#64748B">
                {rate}%
              </text>
            </g>
          );
        })}

        {/* Intervention A & B Vertical Lines */}
        <line x1="226" y1="14" x2="226" y2="162" stroke="#0284C7" strokeDasharray="3 3" />
        <text x="172" y="12" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#0284C7">
          A: Peta Rute (11:00)
        </text>

        <line x1="286" y1="14" x2="286" y2="162" stroke="#2457E7" strokeDasharray="4 4" strokeWidth="1.5" />
        <text x="292" y="12" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#2457E7">
          B: Klarifikasi Resmi (12:00)
        </text>

        {/* Lines */}
        <path d={toPath(respPoints)} fill="none" stroke="#2457E7" strokeWidth="2.6" strokeLinecap="round" />
        <path
          d={toPath(ctrlPoints)}
          fill="none"
          stroke="#008E78"
          strokeWidth="2.2"
          strokeDasharray="5 4"
          strokeLinecap="round"
        />

        {/* Data Nodes */}
        {respPoints.map((p, i) => (
          <g key={`r-${i}`} transform={`translate(${p.x} ${p.y})`}>
            <circle r="4.5" fill="#2457E7" stroke="#FFFFFF" strokeWidth="1.5" />
            <text y="-7" textAnchor="middle" fontSize="7.5" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#12213D">
              {RESPONSE_RATES[i]}%
            </text>
          </g>
        ))}
        {ctrlPoints.map((p, i) => (
          <g key={`c-${i}`} transform={`translate(${p.x} ${p.y})`}>
            <circle r="4" fill="#008E78" stroke="#FFFFFF" strokeWidth="1.4" />
          </g>
        ))}

        {IMPACT_HOURS.map((h, i) => (
          <text
            key={h}
            x={46 + i * 60}
            y="176"
            textAnchor="middle"
            fontSize="8"
            fontFamily="JetBrains Mono, monospace"
            fill="#475569"
          >
            {h}
          </text>
        ))}
      </svg>

      <div className={`tf-impact-result ${sampleMode === 'missing' ? 'is-uncertain' : ''}`} aria-live="polite">
        <span>Kesimpulan Audit Dampak (Difference-in-Differences)</span>
        <strong>
          {sampleMode === 'missing'
            ? 'Ditahan: Data kontrol pasca-11:00 belum lengkap'
            : 'Penurunan -25 poin persentase lebih cepat dari grup pembanding'}
        </strong>
      </div>
    </Frame>
  );
}

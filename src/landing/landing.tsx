import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { BorderBeam } from '../magicui/border-beam';
import { NumberTicker } from '../magicui/number-ticker';
import { collectionGraph } from '../collection-model';
import { capturedLabel, publicPosts, snapshotCounts, snapshotMetadata } from '../public-snapshot';
import { CustomIcon, type FeatureIconName } from './custom-icon';
import { CoordinationPreview, EvidenceReviewPreview, ImpactPreview, NarrativePreview } from './feature-previews';
import './landing.css';

const graph = collectionGraph(publicPosts, 'snapshot');
const mainNode = graph.nodes.reduce((a, b) => (a.references > b.references ? a : b));
const others = graph.nodes.filter(
  (node) => node.id !== mainNode.id && graph.edges.some((edge) => edge.source === node.id || edge.target === node.id),
);
const points = new Map([
  [mainNode.id, { x: 270, y: 143 }],
  ...others.map(
    (node, index) =>
      [node.id, [{ x: 82, y: 78 }, { x: 458, y: 66 }, { x: 452, y: 231 }][index]] as [string, { x: number; y: number }],
  ),
]);
const firstEdge =
  graph.edges.find((edge) => edge.source === mainNode.id && edge.evidence.some((item) => item.post.text === 'BUS')) ||
  graph.edges[0];

function Logo() {
  return (
    <a className="tl-logo" href="#/home" aria-label="TELISIK beranda">
      <img src="/brand/telisik-lens.png" width="38" height="38" alt="" />
      <span>
        TELISIK
        <small>FOLLOW THE EVIDENCE</small>
      </span>
    </a>
  );
}

type StackLogoName =
  | 'bluesky'
  | 'atproto'
  | 'react'
  | 'typescript'
  | 'fastapi'
  | 'python'
  | 'sqlite'
  | 'd3'
  | 'graphology'
  | 'vite';

function StackLogo({ name }: { name: StackLogoName }) {
  switch (name) {
    case 'bluesky':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#0285FF"
            d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"
          />
        </svg>
      );
    case 'atproto':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill="#0085FF" />
          <path
            d="M12 7a5 5 0 1 0 3.54 8.54M15 12v1.2a1.8 1.8 0 0 0 3.6 0V12a6.6 6.6 0 1 0-2.64 5.28"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
        </svg>
      );
    case 'react':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="2.15" fill="#087EA4" />
          <g fill="none" stroke="#087EA4" strokeWidth="1.5">
            <ellipse cx="12" cy="12" rx="10" ry="4.2" />
            <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
          </g>
        </svg>
      );
    case 'typescript':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="#3178C6" />
          <path
            fill="#FFFFFF"
            d="M13.2 11.2v1.9h-2.5V20H8.5v-6.9H6v-1.9h7.2Zm4.7 8.9c-1.3 0-2.4-.4-3.1-1l.9-1.6c.6.5 1.4.8 2.2.8.8 0 1.2-.3 1.2-.8 0-.5-.4-.7-1.5-1.1-1.6-.6-2.5-1.2-2.5-2.6 0-1.6 1.3-2.7 3.2-2.7 1.1 0 2.1.3 2.8.8l-.8 1.6c-.6-.4-1.3-.6-2-.6-.7 0-1.1.3-1.1.7 0 .5.4.7 1.6 1.1 1.6.6 2.4 1.3 2.4 2.7 0 1.7-1.3 2.7-3.3 2.7Z"
          />
        </svg>
      );
    case 'fastapi':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10.5" fill="#009688" />
          <path fill="#FFFFFF" d="M13.2 4.8L6.8 13.3h4.7l-1.1 5.9 6.8-8.5h-4.7l.7-5.9Z" />
        </svg>
      );
    case 'python':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#3776AB"
            d="M11.9 2C7.8 2 8.1 3.8 8.1 3.8l.01 2.1h3.9v.6H6.5S4 6.2 4 10.2c0 4 2.2 3.8 2.2 3.8h1.3v-1.9s-.1-2.2 2.2-2.2h3.8s2.1.03 2.1-2V4.3S15.9 2 11.9 2Zm-2.1 1.4a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z"
          />
          <path
            fill="#FFD43B"
            d="M12.1 22c4.1 0 3.8-1.8 3.8-1.8l-.01-2.1h-3.9v-.6h5.5S20 17.8 20 13.8c0-4-2.2-3.8-2.2-3.8h-1.3v1.9s.1 2.2-2.2 2.2H10.5s-2.1-.03-2.1 2v3.6S8.1 22 12.1 22Zm2.1-1.4a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
          />
        </svg>
      );
    case 'sqlite':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="4.5" fill="#003B57" />
          <path
            fill="#38BDF8"
            d="M16.8 5.2c-2.9.4-5.7 2.6-7.2 5.9-.9 2-1.3 4.2-1.2 6.3l1.7-1.4c.5-.4 1.3-.3 1.7.2-1.1.9-2.2 1.8-3.1 2.6.8.1 1.7.1 2.6-.1 3.3-.6 5.9-3.6 6.3-7.6.2-2-.2-4.1-.8-5.9Z"
          />
          <path
            d="M7.2 18.8c1.1-3.6 3.5-7.6 7.4-11"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case 'd3':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="1.5" y="1.5" width="21" height="21" rx="4.5" fill="#F9A03C" />
          <path
            fill="#FFFFFF"
            d="M5.5 6.5h3.7a5.5 5.5 0 0 1 0 11H5.5v-2.6h3.7a2.9 2.9 0 0 0 0-5.8H5.5V6.5Zm9.8 0h2.8a3.2 3.2 0 0 1 2.2 5.4A3.3 3.3 0 0 1 18.1 17.5h-3.1v-2.5h2.9a1.1 1.1 0 0 0 0-2.2h-2.1v-2.1h2.1a1 1 0 0 0 0-2h-2.6V6.5Z"
          />
        </svg>
      );
    case 'graphology':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 7.5L17.5 6.5L14.5 17.5L6.5 7.5Z" fill="none" stroke="#2457E7" strokeWidth="1.8" />
          <path d="M6.5 7.5L11 12.5L17.5 6.5M11 12.5L14.5 17.5" fill="none" stroke="#008E78" strokeWidth="1.5" />
          <circle cx="6.5" cy="7.5" r="3" fill="#2457E7" />
          <circle cx="17.5" cy="6.5" r="3" fill="#E11D48" />
          <circle cx="14.5" cy="17.5" r="3" fill="#008E78" />
          <circle cx="11" cy="12.5" r="2.2" fill="#12213D" />
        </svg>
      );
    case 'vite':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#646CFF" d="M21.5 4.2L12.3 21.6a.6.6 0 0 1-1.06-.02L2.5 4.2a.6.6 0 0 1 .65-.86l8.9 1.6a.6.6 0 0 0 .22 0l8.58-1.6a.6.6 0 0 1 .65.86Z" />
          <path fill="#FFEA83" d="M15.8 2.4L9.2 3.7a.3.3 0 0 0-.24.28l-.4 6.8a.3.3 0 0 0 .37.31l1.84-.43c.2-.05.38.13.34.33l-.55 2.7c-.04.2.15.37.35.31l1.14-.35c.2-.06.39.11.35.32l-.87 4.2c-.06.27.3.42.45.19l.1-.16 5.5-10.98c.1-.2-.08-.42-.3-.38l-1.94.37c-.2.04-.37-.14-.32-.34l.63-4.18c.04-.2-.14-.38-.35-.34Z" />
        </svg>
      );
  }
}

const TECH_STACK_ITEMS: {
  id: StackLogoName;
  name: string;
  role: string;
  detail: string;
}[] = [
  { id: 'bluesky', name: 'Bluesky', role: 'Jetstream v2', detail: 'Akuisisi Percakapan Publik' },
  { id: 'atproto', name: 'AT Protocol', role: 'AT-URI & DID', detail: 'Provenans Identitas & Post' },
  { id: 'react', name: 'React 19', role: 'UI Konsol', detail: 'Antarmuka Investigasi Interaktif' },
  { id: 'typescript', name: 'TypeScript', role: 'Strict Type', detail: 'Kontrak Skema Bukti & Graf' },
  { id: 'fastapi', name: 'FastAPI', role: 'Async API', detail: 'Layanan Kolektor & Sintesis AI' },
  { id: 'python', name: 'Python 3', role: 'Backend Core', detail: 'Pipeline Ingesti & Kurasi Data' },
  { id: 'sqlite', name: 'SQLite WAL', role: 'Local Store', detail: 'Penyimpanan Rekaman Deterministik' },
  { id: 'graphology', name: 'Graphology', role: 'Louvain & Sigma', detail: 'Klasterisasi & Topologi Jaringan' },
  { id: 'd3', name: 'D3.js', role: 'Visual Forensik', detail: 'Kurva Dampak & Timeline Interaktif' },
  { id: 'vite', name: 'Vite', role: 'Build Engine', detail: 'Bundler Modern Berkecepatan Tinggi' },
];

function goTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });
}

/* ============================================================================
   HERO RIGHT COLUMN: INTERACTIVE WEBAPP VISUAL SHOWCASE
   ============================================================================ */
type HeroShowcaseItem = {
  id: string;
  label: string;
  route: string;
  urlDisplay: string;
  image: string;
  secondaryImage: string;
  badgeTitle: string;
  badgeSub: string;
  metricValue: string;
  metricLabel: string;
  caption: string;
};

const HERO_SHOWCASE_ITEMS: HeroShowcaseItem[] = [
  {
    id: 'graph',
    label: 'Graf Jaringan',
    route: '#/coordination',
    urlDisplay: 'telisik.app/#/coordination · Interaction Network',
    image: '/previews/webapp-graph.png',
    secondaryImage: '/previews/webapp-dna.png',
    badgeTitle: 'Klasterisasi Graphology Louvain',
    badgeSub: '4 Komunitas · Jembatan Antar-Klaster Terpetakan',
    metricValue: '551',
    metricLabel: 'Relasi Terverifikasi',
    caption: 'Peta interaksi multi-komunitas dengan inspeksi bukti langsung pada setiap simpul & tautan.',
  },
  {
    id: 'dna',
    label: 'Narrative DNA',
    route: '#/dna',
    urlDisplay: 'telisik.app/#/dna · Word-by-Word Narrative Diff',
    image: '/previews/webapp-dna.png',
    secondaryImage: '/previews/webapp-coordination.png',
    badgeTitle: 'Pelacakan Pergeseran Kalimat',
    badgeSub: 'Deteksi Hilangnya Konteks & Perubahan Framing',
    metricValue: '100%',
    metricLabel: 'Transparansi Diff Kata',
    caption: 'Bandingkan teks sumber dan turunan kata demi kata untuk melihat di mana makna mulai bergeser.',
  },
  {
    id: 'coordination',
    label: 'Pola Koordinasi',
    route: '#/fingerprint',
    urlDisplay: 'telisik.app/#/fingerprint · Coordination Fingerprint',
    image: '/previews/webapp-coordination.png',
    secondaryImage: '/previews/webapp-briefs.png',
    badgeTitle: 'Matriks Ritme & Co-Sharing',
    badgeSub: 'Uji Sensitivitas Jendela Waktu 3m · 5m · 15m',
    metricValue: '15',
    metricLabel: 'Pasangan Kandidat Uji',
    caption: 'Identifikasi pola pembagian tautan berulang lintas waktu sebagai indikasi awal yang dapat diaudit.',
  },
  {
    id: 'briefs',
    label: 'AI Brief',
    route: '#/briefs',
    urlDisplay: 'telisik.app/#/briefs · Evidence-Grounded AI Brief',
    image: '/previews/webapp-briefs.png',
    secondaryImage: '/previews/webapp-network.png',
    badgeTitle: 'TELISIK Neural Brief Engine',
    badgeSub: 'Setiap Klaim Wajib Merujuk Nomor Bukti [1]–[6]',
    metricValue: '0',
    metricLabel: 'Klaim Tanpa Sitasi',
    caption: 'Sintesis laporan analitik otomatis yang mengikat setiap temuan langsung ke rekaman sumber.',
  },
];

function HeroInspectionWorkbench() {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = HERO_SHOWCASE_ITEMS[activeIdx];

  return (
    <div className="tl-hero-showcase" aria-label="Visual antarmuka aplikasi TELISIK">
      {/* Ambient decorative glow & secondary layered screen for depth */}
      <div className="tl-showcase-glow" aria-hidden="true" />
      <div className="tl-showcase-backcard" aria-hidden="true">
        <img src={current.secondaryImage} alt="" loading="lazy" />
      </div>

      {/* Main App Window Frame */}
      <div className="tl-showcase-window">
        <div className="tl-showcase-topbar">
          <div className="tl-showcase-dots" aria-hidden="true">
            <span className="is-red" />
            <span className="is-amber" />
            <span className="is-green" />
          </div>
          <div className="tl-showcase-address">
            <img src="/brand/telisik-lens.png" alt="" width="14" height="14" />
            <span>{current.urlDisplay}</span>
          </div>
          <a href={current.route} className="tl-showcase-open-btn" title="Buka halaman ini di aplikasi">
            Buka Live ↗
          </a>
        </div>

        {/* Interactive View Switcher Bar */}
        <div className="tl-showcase-tabs" role="tablist" aria-label="Pilih tampilan modul aplikasi">
          {HERO_SHOWCASE_ITEMS.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeIdx === idx}
              className={`tl-showcase-tab ${activeIdx === idx ? 'is-active' : ''}`}
              onClick={() => setActiveIdx(idx)}
            >
              <span className="tl-showcase-tab-num">0{idx + 1}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* High-res Webapp Visual Image */}
        <a href={current.route} className="tl-showcase-viewport" aria-label={`Buka modul ${current.label}`}>
          <img
            key={current.image}
            src={current.image}
            alt={`Tampilan aplikasi TELISIK — ${current.label}`}
            className="tl-showcase-img"
          />
          <div className="tl-showcase-hover-cta">
            <span>Klik untuk Eksplorasi Interaktif →</span>
          </div>
        </a>

        {/* Bottom Caption Bar */}
        <div className="tl-showcase-foot">
          <p>{current.caption}</p>
          <a href={current.route}>Buka Modul →</a>
        </div>
      </div>

      {/* Floating Glass Callout Badges */}
      <div className="tl-showcase-float tl-float-bottom-left">
        <div className="tl-float-icon">
          <img src="/brand/telisik-lens.png" alt="" width="24" height="24" />
        </div>
        <div className="tl-float-text">
          <strong>{current.badgeTitle}</strong>
          <span>{current.badgeSub}</span>
        </div>
      </div>

      <div className="tl-showcase-float tl-float-top-right">
        <span className="tl-float-metric">{current.metricValue}</span>
        <span className="tl-float-label">{current.metricLabel}</span>
      </div>
    </div>
  );
}

/* ============================================================================
   INTERACTIVE NETWORK EVIDENCE PREVIEW (Module 01 inside Workbench — Rich 18-Node Topology)
   ============================================================================ */
type RichNetNode = {
  id: string;
  handle: string;
  role: string;
  cluster: 'koridor' | 'komuter' | 'klarifikasi';
  x: number;
  y: number;
  r: number;
  deg: number;
  hub?: boolean;
};

type RichNetEdge = {
  id: string;
  source: string;
  target: string;
  kind: 'REPLY' | 'QUOTE';
  weight: number;
  time: string;
  uri: string;
  parentText: string;
  replyText: string;
};

const RICH_NODES: RichNetNode[] = [
  // Klaster #01: Koridor & Transjakarta (Blue)
  { id: 'n1', handle: 'transjkt.id', role: 'Hub Utama', cluster: 'koridor', x: 178, y: 128, r: 16, deg: 14, hub: true },
  { id: 'n2', handle: 'infohaltecendana', role: 'Amplifier', cluster: 'koridor', x: 98, y: 66, r: 11.5, deg: 7 },
  { id: 'n3', handle: 'koridor4b.live', role: 'Reporter', cluster: 'koridor', x: 78, y: 152, r: 11, deg: 6 },
  { id: 'n4', handle: 'pantaurute.jkt', role: 'Kontributor', cluster: 'koridor', x: 142, y: 212, r: 9.5, deg: 5 },
  { id: 'n5', handle: 'busway.watch', role: 'Saksi Lapangan', cluster: 'koridor', x: 56, y: 218, r: 8.5, deg: 4 },
  { id: 'n6', handle: 'jaklingko.feed', role: 'Agregasi Rute', cluster: 'koridor', x: 218, y: 54, r: 9.5, deg: 5 },
  { id: 'n7', handle: 'halte.update', role: 'Monitor', cluster: 'koridor', x: 42, y: 102, r: 8, deg: 3 },

  // Klaster #02: Komuter & Warga (Teal)
  { id: 'n8', handle: 'wargacendana', role: 'Hub Komunitas', cluster: 'komuter', x: 356, y: 92, r: 14.5, deg: 11, hub: true },
  { id: 'n9', handle: 'komuter.manggarai', role: 'Jembatan Klaster', cluster: 'komuter', x: 272, y: 116, r: 11.5, deg: 8 },
  { id: 'n10', handle: 'penumpang.pagi', role: 'Warga Komuter', cluster: 'komuter', x: 436, y: 52, r: 9.5, deg: 5 },
  { id: 'n11', handle: 'forum.sudirman', role: 'Diskusi Warga', cluster: 'komuter', x: 466, y: 114, r: 10, deg: 6 },
  { id: 'n12', handle: 'suara.penumpang', role: 'Saksi', cluster: 'komuter', x: 316, y: 42, r: 8.5, deg: 4 },
  { id: 'n13', handle: 'krl.antrean', role: 'Komuter', cluster: 'komuter', x: 506, y: 74, r: 8, deg: 3 },

  // Klaster #03: Klarifikasi & Dokumen Resmi (Sky/Navy)
  { id: 'n14', handle: 'dishub.dki', role: 'Kanal Resmi', cluster: 'klarifikasi', x: 386, y: 198, r: 14, deg: 10, hub: true },
  { id: 'n15', handle: 'cekfakta.publik', role: 'Verifikator', cluster: 'klarifikasi', x: 278, y: 196, r: 11, deg: 7 },
  { id: 'n16', handle: 'humas.transport', role: 'Rilis Resmi', cluster: 'klarifikasi', x: 478, y: 184, r: 9.5, deg: 5 },
  { id: 'n17', handle: 'redaksi.kota', role: 'Jurnalis', cluster: 'klarifikasi', x: 448, y: 236, r: 9, deg: 4 },
  { id: 'n18', handle: 'arsip.layanan', role: 'Dokumentasi', cluster: 'klarifikasi', x: 328, y: 238, r: 8.5, deg: 3 },
];

const RICH_EDGES: RichNetEdge[] = [
  {
    id: 'e1',
    source: 'n2',
    target: 'n1',
    kind: 'QUOTE',
    weight: 3,
    time: '08:14 WIB',
    uri: 'at://did:plc:7k9c/app.bsky.feed.post/3l2kor01',
    parentText: ' Pembaruan layanan pagi: rekayasa jalur dilakukan bertahap di sekitar koridor Halte Cendana.',
    replyText: 'Antrean bus koridor 4B tertahan 25 menit di simpang utama, apakah halte ditutup total pagi ini?',
  },
  {
    id: 'e2',
    source: 'n9',
    target: 'n1',
    kind: 'REPLY',
    weight: 3,
    time: '08:19 WIB',
    uri: 'at://did:plc:9m2x/app.bsky.feed.post/3l2kor02',
    parentText: 'Pembaruan layanan pagi: rekayasa jalur dilakukan bertahap di sekitar koridor Halte Cendana.',
    replyText: 'Penumpang dari arah Manggarai dialihkan ke halte sementara, mohon kepastian jadwal pembukaan kembali.',
  },
  {
    id: 'e3',
    source: 'n8',
    target: 'n9',
    kind: 'QUOTE',
    weight: 2.6,
    time: '08:27 WIB',
    uri: 'at://did:plc:4p8q/app.bsky.feed.post/3l2kom03',
    parentText: 'Penumpang dari arah Manggarai dialihkan ke halte sementara, mohon kepastian jadwal pembukaan kembali.',
    replyText: 'Banyak komuter mengira penutupan bersifat permanen karena papan pengumuman lama belum diganti.',
  },
  {
    id: 'e4',
    source: 'n14',
    target: 'n8',
    kind: 'REPLY',
    weight: 2.8,
    time: '09:05 WIB',
    uri: 'at://did:plc:1d4h/app.bsky.feed.post/3l2kla04',
    parentText: 'Banyak komuter mengira penutupan bersifat permanen karena papan pengumuman lama belum diganti.',
    replyText: 'Klarifikasi resmi Surat Edaran DOC-01: Halte Cendana hanya direvitalisasi sementara 08:00–14:00, bukan ditutup permanen.',
  },
  {
    id: 'e5',
    source: 'n15',
    target: 'n1',
    kind: 'QUOTE',
    weight: 2.4,
    time: '09:12 WIB',
    uri: 'at://did:plc:6v3k/app.bsky.feed.post/3l2kla05',
    parentText: 'Klarifikasi resmi Surat Edaran DOC-01: Halte Cendana hanya direvitalisasi sementara 08:00–14:00.',
    replyText: 'Verifikasi silang dokumen operasional menunjukkan 3 shuttle pengganti sudah beroperasi sejak pukul 08:30 WIB.',
  },
  { id: 'e6', source: 'n3', target: 'n1', kind: 'REPLY', weight: 2, time: '08:16 WIB', uri: 'at://did:plc:k4b/post/06', parentText: 'Info jalur koridor 4B pagi ini.', replyText: 'Bus kedua sudah masuk jalur pengalihan via pintu timur.' },
  { id: 'e7', source: 'n4', target: 'n1', kind: 'REPLY', weight: 1.8, time: '08:21 WIB', uri: 'at://did:plc:pr1/post/07', parentText: 'Info jalur koridor 4B pagi ini.', replyText: 'Tercatat kepadatan turun 18% setelah shuttle tambahan tiba.' },
  { id: 'e8', source: 'n6', target: 'n1', kind: 'QUOTE', weight: 1.8, time: '08:22 WIB', uri: 'at://did:plc:jk1/post/08', parentText: 'Integrasi rute JakLingko mikrotrans pagi ini.', replyText: 'Rute JAK-14 tetap berhenti di titik jemput utara Halte Cendana.' },
  { id: 'e9', source: 'n7', target: 'n2', kind: 'REPLY', weight: 1.4, time: '08:17 WIB', uri: 'at://did:plc:hu1/post/09', parentText: 'Antrean bus koridor 4B tertahan 25 menit.', replyText: 'Petugas lapangan sudah mengarahkan penumpang ke peron B.' },
  { id: 'e10', source: 'n5', target: 'n3', kind: 'REPLY', weight: 1.5, time: '08:24 WIB', uri: 'at://did:plc:bw1/post/10', parentText: 'Bus kedua sudah masuk jalur pengalihan.', replyText: 'Waktu tunggu rata-rata kembali ke 7 menit di peron sementara.' },
  { id: 'e11', source: 'n5', target: 'n4', kind: 'REPLY', weight: 1.3, time: '08:29 WIB', uri: 'at://did:plc:bw1/post/11', parentText: 'Tercatat kepadatan turun 18%.', replyText: 'Dokumentasi visual peron timur pukul 08:28 WIB terlampir.' },
  { id: 'e12', source: 'n6', target: 'n9', kind: 'REPLY', weight: 1.7, time: '08:31 WIB', uri: 'at://did:plc:jk1/post/12', parentText: 'Penumpang dari arah Manggarai dialihkan.', replyText: 'Tersedia penunjuk arah baru di jembatan penyeberangan.' },
  { id: 'e13', source: 'n10', target: 'n8', kind: 'REPLY', weight: 1.9, time: '08:33 WIB', uri: 'at://did:plc:pp1/post/13', parentText: 'Banyak komuter mengira penutupan bersifat permanen.', replyText: 'Terima kasih infonya, tadi sempat beredar potongan gambar tanpa tanggal.' },
  { id: 'e14', source: 'n11', target: 'n8', kind: 'QUOTE', weight: 2.1, time: '08:36 WIB', uri: 'at://did:plc:fs1/post/14', parentText: 'Banyak komuter mengira penutupan bersifat permanen.', replyText: 'Kami bantu sebarkan jadwal pengalihan resmi ke grup komuter Sudirman.' },
  { id: 'e15', source: 'n12', target: 'n8', kind: 'REPLY', weight: 1.5, time: '08:38 WIB', uri: 'at://did:plc:sp1/post/15', parentText: 'Banyak komuter mengira penutupan bersifat permanen.', replyText: 'Peron bayangan di sisi selatan cukup lancar pagi ini.' },
  { id: 'e16', source: 'n13', target: 'n10', kind: 'REPLY', weight: 1.3, time: '08:40 WIB', uri: 'at://did:plc:ka1/post/16', parentText: 'Tadi sempat beredar potongan gambar tanpa tanggal.', replyText: 'Benar, potongan gambar tersebut ternyata arsip pemeliharaan tahun lalu.' },
  { id: 'e17', source: 'n13', target: 'n11', kind: 'REPLY', weight: 1.4, time: '08:42 WIB', uri: 'at://did:plc:ka1/post/17', parentText: 'Kami bantu sebarkan jadwal pengalihan resmi.', replyText: 'Koneksi KRL ke halte transit terpantau normal kembali.' },
  { id: 'e18', source: 'n12', target: 'n6', kind: 'REPLY', weight: 1.4, time: '08:44 WIB', uri: 'at://did:plc:sp1/post/18', parentText: 'Rute JAK-14 tetap berhenti di titik jemput utara.', replyText: 'Konfirmasi dari lapangan: mikrotrans beroperasi penuh.' },
  { id: 'e19', source: 'n15', target: 'n9', kind: 'REPLY', weight: 2.0, time: '09:08 WIB', uri: 'at://did:plc:cf1/post/19', parentText: 'Penumpang dari arah Manggarai dialihkan.', replyText: 'Tautan surat edaran lengkap sudah dilampirkan pada utas utama.' },
  { id: 'e20', source: 'n15', target: 'n4', kind: 'REPLY', weight: 1.6, time: '09:14 WIB', uri: 'at://did:plc:cf1/post/20', parentText: 'Tercatat kepadatan turun 18%.', replyText: 'Data telemetri cocok dengan log keberangkatan koridor.' },
  { id: 'e21', source: 'n16', target: 'n14', kind: 'QUOTE', weight: 1.9, time: '09:06 WIB', uri: 'at://did:plc:ht1/post/21', parentText: 'Klarifikasi resmi Surat Edaran DOC-01.', replyText: 'Peta pengalihan resolusi tinggi telah dipasang di 6 titik halte.' },
  { id: 'e22', source: 'n17', target: 'n14', kind: 'REPLY', weight: 1.7, time: '09:16 WIB', uri: 'at://did:plc:rk1/post/22', parentText: 'Klarifikasi resmi Surat Edaran DOC-01.', replyText: 'Laporan lapangan redaksi mengonfirmasi layanan kembali normal pukul 11:30.' },
  { id: 'e23', source: 'n18', target: 'n15', kind: 'REPLY', weight: 1.5, time: '09:19 WIB', uri: 'at://did:plc:al1/post/23', parentText: 'Verifikasi silang dokumen operasional.', replyText: 'Salinan arsip DOC-01 dan DOC-02 tersimpan dalam repositori bukti publik.' },
  { id: 'e24', source: 'n18', target: 'n14', kind: 'REPLY', weight: 1.5, time: '09:21 WIB', uri: 'at://did:plc:al1/post/24', parentText: 'Klarifikasi resmi Surat Edaran DOC-01.', replyText: 'Rantai sitasi AT-URI telah divalidasi tanpa tautan yatim.' },
  { id: 'e25', source: 'n16', target: 'n11', kind: 'REPLY', weight: 1.6, time: '09:09 WIB', uri: 'at://did:plc:ht1/post/25', parentText: 'Kami bantu sebarkan jadwal pengalihan resmi.', replyText: 'Infografis jadwal shuttle pengganti siap diunduh warga.' },
  { id: 'e26', source: 'n17', target: 'n16', kind: 'REPLY', weight: 1.4, time: '09:24 WIB', uri: 'at://did:plc:rk1/post/26', parentText: 'Peta pengalihan resolusi tinggi telah dipasang.', replyText: 'Pemantauan pasca-klarifikasi menunjukkan penurunan klaim keliru sebesar 34%.' },
];

const CLUSTER_COLORS: Record<RichNetNode['cluster'], { fill: string; ring: string; badge: string; label: string }> = {
  koridor: { fill: '#2457E7', ring: 'rgba(36, 87, 231, 0.22)', badge: '#EFF6FF', label: 'Klaster #01 · Koridor' },
  komuter: { fill: '#008E78', ring: 'rgba(0, 142, 120, 0.22)', badge: '#ECFDF5', label: 'Klaster #02 · Komuter' },
  klarifikasi: { fill: '#0284C7', ring: 'rgba(2, 132, 199, 0.22)', badge: '#E0F2FE', label: 'Klaster #03 · Klarifikasi' },
};

function EvidencePreview() {
  const [tab, setTab] = useState<'network' | 'evidence'>('network');
  const [clusterFilter, setClusterFilter] = useState<'all' | RichNetNode['cluster']>('all');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>(RICH_EDGES[0].id);
  const prefix = useId();

  const nodeMap = new Map(RICH_NODES.map((n) => [n.id, n]));
  const activeEdge = RICH_EDGES.find((e) => e.id === selectedEdgeId) || RICH_EDGES[0];
  const srcNode = nodeMap.get(activeEdge.source)!;
  const dstNode = nodeMap.get(activeEdge.target)!;

  const visibleNodes = RICH_NODES.filter((n) => clusterFilter === 'all' || n.cluster === clusterFilter);
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = RICH_EDGES.filter(
    (e) =>
      clusterFilter === 'all' ||
      (visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)) ||
      e.id === selectedEdgeId,
  );

  const selectNode = (nodeId: string) => {
    const connected = RICH_EDGES.find((e) => e.source === nodeId || e.target === nodeId);
    if (connected) setSelectedEdgeId(connected.id);
  };

  return (
    <div className="tl-preview-wrap">
      <div className="tl-preview">
        <BorderBeam size={150} duration={9} colorFrom="#2457e7" colorTo="#008e78" borderWidth={1.4} />
        <header>
          <span className="tl-preview-mark">
            <img src="/brand/telisik-lens.png" width="20" height="20" alt="" />
            Conversation Network · Multi-Cluster Topology
          </span>
          <span className="tl-proof-tag">
            <i />3 Klaster Louvain · 18 Simpul Aktif
          </span>
        </header>

        <div className="tl-preview-numbers">
          {[
            [148, 'post terindeks'],
            [RICH_NODES.length, 'simpul akun'],
            [RICH_EDGES.length, 'koneksi reply & quote'],
          ].map(([value, lbl], i) => (
            <div key={lbl} aria-label={`${value} ${lbl}`}>
              <strong>
                <NumberTicker value={Number(value)} delay={i * 0.06} aria-hidden="true" />
              </strong>
              <span>{lbl}</span>
            </div>
          ))}
        </div>

        <div className="tl-preview-tabs" role="tablist" aria-label="Filter klaster dan tampilan bukti">
          {[
            ['all', 'Semua (18)'],
            ['koridor', 'Koridor (7)'],
            ['komuter', 'Komuter (6)'],
            ['klarifikasi', 'Klarifikasi (5)'],
          ].map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={clusterFilter === id && tab === 'network'}
              onClick={() => {
                setClusterFilter(id as typeof clusterFilter);
                setTab('network');
              }}
            >
              {lbl}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'evidence'}
            onClick={() => setTab(tab === 'evidence' ? 'network' : 'evidence')}
          >
            <CustomIcon name="evidence" size={14} /> {tab === 'evidence' ? 'Tutup Bukti' : 'Inspeksi AT-URI'}
          </button>
        </div>

        <div className={`tl-preview-body ${tab === 'evidence' ? 'is-evidence' : ''}`} id={`${prefix}-panel`}>
          {tab === 'network' ? (
            <>
              <svg className="tl-hero-network" viewBox="0 0 540 264" aria-label="Peta jaringan percakapan multi-klaster">
                <defs>
                  <marker
                    id={`${prefix}-arrow`}
                    viewBox="0 0 10 10"
                    refX="14"
                    refY="5"
                    markerWidth="4.5"
                    markerHeight="4.5"
                    orient="auto"
                  >
                    <path d="M0 0 10 5 0 10Z" fill="#94A3B8" />
                  </marker>
                  <marker
                    id={`${prefix}-arrow-active`}
                    viewBox="0 0 10 10"
                    refX="14"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto"
                  >
                    <path d="M0 0 10 5 0 10Z" fill="#2457E7" />
                  </marker>
                </defs>

                {/* Subtle Community Cluster Auras */}
                {(clusterFilter === 'all' || clusterFilter === 'koridor') && (
                  <g>
                    <ellipse
                      cx="132"
                      cy="138"
                      rx="108"
                      ry="98"
                      fill="rgba(36, 87, 231, 0.045)"
                      stroke="rgba(36, 87, 231, 0.16)"
                      strokeDasharray="4 4"
                    />
                    <text x="36" y="28" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#2457E7">
                      KLASTER #01 · KORIDOR
                    </text>
                  </g>
                )}
                {(clusterFilter === 'all' || clusterFilter === 'komuter') && (
                  <g>
                    <ellipse
                      cx="392"
                      cy="86"
                      rx="126"
                      ry="66"
                      fill="rgba(0, 142, 120, 0.045)"
                      stroke="rgba(0, 142, 120, 0.18)"
                      strokeDasharray="4 4"
                    />
                    <text x="310" y="22" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#008E78">
                      KLASTER #02 · KOMUTER
                    </text>
                  </g>
                )}
                {(clusterFilter === 'all' || clusterFilter === 'klarifikasi') && (
                  <g>
                    <ellipse
                      cx="384"
                      cy="208"
                      rx="118"
                      ry="52"
                      fill="rgba(2, 132, 199, 0.045)"
                      stroke="rgba(2, 132, 199, 0.18)"
                      strokeDasharray="4 4"
                    />
                    <text x="302" y="258" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#0284C7">
                      KLASTER #03 · KLARIFIKASI RESMI
                    </text>
                  </g>
                )}

                {/* Directed Reply & Quote Edges */}
                {visibleEdges.map((e) => {
                  const a = nodeMap.get(e.source)!;
                  const b = nodeMap.get(e.target)!;
                  const isSelected = e.id === activeEdge.id;
                  const dx = b.x - a.x;
                  const dy = b.y - a.y;
                  const len = Math.hypot(dx, dy) || 1;
                  const curve = e.kind === 'QUOTE' ? 16 : 8;
                  const d = `M${a.x} ${a.y} Q${(a.x + b.x) / 2 - (dy / len) * curve} ${(a.y + b.y) / 2 + (dx / len) * curve} ${b.x} ${b.y}`;
                  return (
                    <g
                      key={e.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedEdgeId(e.id)}
                    >
                      <path d={d} fill="none" stroke="transparent" strokeWidth="14" />
                      <path
                        d={d}
                        fill="none"
                        stroke={isSelected ? '#2457E7' : e.kind === 'QUOTE' ? '#64748B' : '#CBD5E1'}
                        strokeWidth={isSelected ? 2.6 : Math.max(1.1, e.weight * 0.65)}
                        strokeDasharray={e.kind === 'QUOTE' && !isSelected ? '3 3' : undefined}
                        markerEnd={`url(#${prefix}-${isSelected ? 'arrow-active' : 'arrow'})`}
                      />
                    </g>
                  );
                })}

                {/* 18 Interactive Community Nodes */}
                {visibleNodes.map((n) => {
                  const palette = CLUSTER_COLORS[n.cluster];
                  const isEndpoint = n.id === activeEdge.source || n.id === activeEdge.target;
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x} ${n.y})`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => selectNode(n.id)}
                    >
                      {(n.hub || isEndpoint) && (
                        <circle
                          r={n.r + 5}
                          fill={palette.ring}
                          stroke={isEndpoint ? '#2457E7' : palette.fill}
                          strokeWidth={isEndpoint ? 1.6 : 1}
                        />
                      )}
                      <circle
                        r={n.r}
                        fill={palette.fill}
                        stroke="#FFFFFF"
                        strokeWidth={isEndpoint ? 2.2 : 1.5}
                      />
                      <text
                        textAnchor="middle"
                        y="3.5"
                        fontSize={n.r >= 13 ? '8.5' : '7'}
                        fontWeight="700"
                        fill="#FFFFFF"
                      >
                        {n.deg}
                      </text>
                      {(n.hub || isEndpoint || n.r >= 11) && (
                        <g transform={`translate(0, ${n.r + 11})`}>
                          <rect
                            x="-46"
                            y="-8"
                            width="92"
                            height="14"
                            rx="3"
                            fill="rgba(255,255,255,0.92)"
                            stroke={isEndpoint ? '#2457E7' : '#CBD5E1'}
                            strokeWidth="0.9"
                          />
                          <text
                            textAnchor="middle"
                            y="1.5"
                            fontFamily="JetBrains Mono, monospace"
                            fontSize="7.5"
                            fontWeight={isEndpoint ? '700' : '600'}
                            fill="#12213D"
                          >
                            @{n.handle.slice(0, 13)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Live Selected Edge Inspector Strip */}
              <div className="tl-net-inspector-strip">
                <div className="tl-net-insp-head">
                  <span className="tl-net-insp-badge">
                    {activeEdge.kind} · {activeEdge.time}
                  </span>
                  <span className="tl-net-insp-pair">
                    @{srcNode.handle} ──► @{dstNode.handle}
                  </span>
                  <code className="tl-net-insp-uri">{activeEdge.uri}</code>
                </div>
                <p className="tl-net-insp-quote">“{activeEdge.replyText}”</p>
              </div>
            </>
          ) : (
            <div className="tl-source-evidence">
              <div>
                <span>
                  <CustomIcon name="narrative" size={15} />
                  Post Induk · @{srcNode.handle} ({srcNode.role})
                </span>
                <p>{activeEdge.parentText}</p>
                <a href="#/collected">
                  Lihat di Graf Penuh ({activeEdge.uri.slice(0, 28)}…) <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div className="tl-reply-record">
                <span>
                  <CustomIcon name="evidence" size={15} />
                  {activeEdge.kind} · @{dstNode.handle} ({activeEdge.time})
                </span>
                <p>{activeEdge.replyText}</p>
                <a href="#/collected">
                  Buka Rantai Sitasi Lengkap <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          )}
        </div>
        <footer>
          <span>Klik simpul atau garis mana pun untuk menginspeksi bukti interaksi.</span>
          <a href="#/collected">
            Buka modul penuh <span aria-hidden="true">→</span>
          </a>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================================
   DATA DEFINITIONS: PIPELINE, FEATURES, PILLARS, TIERS, FAQ
   ============================================================================ */
const PIPELINE_STEPS = [
  {
    num: '01',
    tag: 'INGESTION',
    title: 'Koleksi & Kurasi Sinyal',
    desc: 'Tarik post publik dari Bluesky Jetstream v2 atau muat korpus JSON/CSV/JSONL ke dalam penyimpanan SQLite WAL lokal tanpa kehilangan rujukan URI.',
    detail: 'Bluesky Jetstream · Impor Korpus',
    href: '#/data',
    bg: '/illustrations/telisik-hero-v15.webp',
  },
  {
    num: '02',
    tag: 'GRAPH',
    title: 'Conversation Network',
    desc: 'Petakan siapa merujuk ke siapa berdasarkan struktur reply dan quote asli, lalu kelompokkan komunitas percakapan dengan algoritma Louvain.',
    detail: '28 Post Asli · Graphology Louvain',
    href: '#/collected',
    bg: '/feature-icons/network.webp',
  },
  {
    num: '03',
    tag: 'FORENSICS',
    title: 'Narrative DNA & Fingerprint',
    desc: 'Lacak perubahan kata kunci dari pertanyaan menjadi klaim serta periksa pola berbagi tautan berulang dalam jendela waktu sempit.',
    detail: 'Word Diff · Co-Sharing Matrix',
    href: '#/dna',
    bg: '/feature-icons/narrative.webp',
  },
  {
    num: '04',
    tag: 'VERIFICATION',
    title: 'Evidence Review & Sintesis AI',
    desc: 'Uji klaim terhadap dokumen utuh dan hasilkan ringkasan eksekutif otomatis menggunakan Mesin Sintesis AI dengan sitasi bukti.',
    detail: 'Evidence Arena · Sintesis Brief AI',
    href: '#/review',
    bg: '/illustrations/telisik-context-lens.png',
  },
  {
    num: '05',
    tag: 'EVALUATION',
    title: 'Impact Review',
    desc: 'Catat intervensi atau klarifikasi publik, bandingkan metrik sebelum-sesudah terhadap grup pembanding, dan dokumentasikan batas bukti.',
    detail: 'Pre/Post Audit · Kontrol Pembanding',
    href: '#/impact',
    bg: '/feature-icons/impact.webp',
  },
];

type Feature = {
  id: FeatureIconName;
  name: string;
  short: string;
  title: string;
  description: string;
  detail: string;
  href: string;
  cta: string;
  real?: boolean;
  specs: [string, string][];
  guide: string;
  bg: string;
};

const FEATURES: Feature[] = [
  {
    id: 'network',
    name: 'Conversation Network',
    short: '01 Network',
    title: 'Setiap koneksi punya cerita. Dan sumber yang dapat dibuka.',
    description:
      'Lihat siapa merujuk ke siapa secara struktural. Klik satu garis untuk membuka post sumber dan balasannya secara langsung, tanpa menebak hubungan dari kemiripan kata semata.',
    detail: '28 post publik Bluesky asli · 7 akun · 5 koneksi reply terverifikasi.',
    href: '#/collected',
    cta: 'Telusuri Network Asli',
    real: true,
    specs: [
      ['Sumber Data', 'Snapshot Publik Bluesky (28 Post)'],
      ['Konstruksi Graf', 'Reply & Quote AT-URI Deterministik'],
      ['Deteksi Klaster', 'Graphology Louvain Modularity'],
    ],
    guide: 'Klik tab "Bukti sumber" atau klik langsung salah satu garis koneksi pada graf untuk membuka kutipan post asli.',
    bg: '/feature-icons/network.webp',
  },
  {
    id: 'narrative',
    name: 'Narrative DNA',
    short: '02 Narrative DNA',
    title: 'Satu kata berubah. Maknanya ikut bergeser.',
    description:
      'Ikuti perjalanan sebuah narasi dari sumber awal ke versi-versi berikutnya. Inspeksi kata yang hilang, ditambahkan, atau berubah dari kalimat tanya menjadi klaim pasti.',
    detail: 'Bandingkan fase kalimat tanya dan klaim pada studi kasus Cendana.',
    href: '#/dna',
    cta: 'Jelajahi Narrative DNA',
    specs: [
      ['Skenario Uji', 'Studi Kasus Halte Cendana'],
      ['Metode Analisis', 'Word-Level Diff & Jaccard'],
      ['Indikator Kunci', 'Pergeseran Pertanyaan → Klaim'],
    ],
    guide: 'Gunakan tombol "Versi pertanyaan" dan "Versi klaim" di panel kanan untuk melihat kata yang dihapus (merah) dan ditambahkan (hijau).',
    bg: '/feature-icons/narrative.webp',
  },
  {
    id: 'coordination',
    name: 'Coordination Fingerprint',
    short: '03 Pola Koordinasi',
    title: 'Temukan pola berbagi serentak yang layak diperiksa.',
    description:
      'Periksa tautan dan frase yang dibagikan berulang dalam jendela waktu pendek. Geser ambang waktu (5m, 10m, 15m) untuk menguji seberapa kuat bukti ko-aktivitasnya.',
    detail: 'Pola waktu adalah petunjuk awal untuk review analis, bukan vonis otomatis.',
    href: '#/fingerprint',
    cta: 'Periksa Pola Berbagi',
    specs: [
      ['Skenario Uji', '6 Akun · 3 Tautan Berulang'],
      ['Parameter Uji', 'Sensitivitas Ambang Waktu (Δt)'],
      ['Prinsip Audit', 'Indikasi Awal (Human-in-the-Loop)'],
    ],
    guide: 'Ubah ambang waktu antara "≤ 2 menit" dan "Menit sama" untuk menguji berapa pasangan akun yang tetap terdeteksi sinkron.',
    bg: '/feature-icons/coordination.webp',
  },
  {
    id: 'evidence',
    name: 'Evidence Review',
    short: '04 Bukti & Klaim',
    title: 'Uji klaim terhadap konteks dokumen yang utuh.',
    description:
      'Bandingkan klaim yang beredar dengan dokumen sumber lengkap. Pisahkan bukti yang mendukung, bertentangan, atau belum cukup untuk mengambil kesimpulan.',
    detail: 'Bandingkan potongan kutipan dengan dokumen pengumuman utuh.',
    href: '#/review',
    cta: 'Masuk ke Ruang Review',
    specs: [
      ['Klaim Diuji', '"Halte Cendana ditutup permanen"'],
      ['Pembanding', 'Dokumen Utuh vs Potongan Kutipan'],
      ['Keluaran', 'Status Verifikasi & Sitasi Ayat'],
    ],
    guide: 'Bandingkan "Pengumuman lengkap" dan "Potongan dokumen" untuk melihat bagaimana konteks yang terpotong mengubah status bukti.',
    bg: '/feature-icons/evidence.webp',
  },
  {
    id: 'impact',
    name: 'Impact Review',
    short: '05 Evaluasi Dampak',
    title: 'Sudah ditindaklanjuti. Lalu, apa yang benar-benar berubah?',
    description:
      'Catat tindakan klarifikasi atau respons layanan, bandingkan kondisi sebelum dan sesudah, lalu uji terhadap grup pembanding agar klaim keberhasilan tetap jujur pada batas datanya.',
    detail: 'Jika grup pembanding dihapus, sistem menahan klaim estimasi dampak.',
    href: '#/impact',
    cta: 'Jelajahi Evaluasi Hasil',
    specs: [
      ['Metode Evaluasi', 'Selisih Pra/Pasca vs Grup Pembanding'],
      ['Pengaman Metodologi', 'Penahanan Klaim Saat Data Kurang'],
      ['Visualisasi', 'Kurva Proporsi Klaim per Jam'],
    ],
    guide: 'Klik tombol "Pembanding hilang" untuk melihat bagaimana TELISIK secara otomatis menahan kesimpulan saat data kontrol tidak lengkap.',
    bg: '/feature-icons/impact.webp',
  },
];

const FAQS: [string, string][] = [
  [
    'Apakah data Conversation Network benar-benar asli?',
    `Ya. Modul Conversation Network memuat ${publicPosts.length} post publik Bluesky asli (${snapshotCounts.primary} post cocok kata kunci dan ${snapshotCounts.context} post konteks balasan) yang diambil pada ${capturedLabel}. Empat skenario studi kasus lainnya disediakan untuk menguji alur forensik narasi, koordinasi, bukti, dan dampak secara menyeluruh.`,
  ],
  [
    'Bagaimana integrasi Mesin AI bekerja di TELISIK?',
    'TELISIK menggunakan mesin sintesis AI terverifikasi untuk membantu proses telaah analis. Setiap kali analis menekan "Buat Brief AI" di Data & AI Workspace, sistem menyusun ringkasan eksekutif, temuan utama beserta ID bukti sumber, batasan analisis, dan rekomendasi tindak lanjut.',
  ],
  [
    'Mengapa pola koordinasi tidak langsung melabeli akun sebagai bot?',
    'Karena kesamaan waktu posting atau pembagian tautan (co-sharing) dapat terjadi secara organik saat berita besar berlangsung. TELISIK menampilkan matriks bukti secara transparan dan memberi kontrol ambang waktu kepada analis agar keputusan tetap berada di bawah kendali manusia (human-in-the-loop).',
  ],
  [
    'Bisakah saya memasukkan dataset atau menangkap stream baru?',
    'Bisa. Melalui halaman Data & AI Workspace (#/data), Anda dapat mengimpor dataset JSON, JSONL, atau CSV, mengambil post terbaru dari Bluesky Jetstream, serta menjalankan ulang pipeline analitik dan penyimpanan SQLite lokal.',
  ],
];

/* ============================================================================
   MAIN LANDING PAGE COMPONENT
   ============================================================================ */
export function LandingPage() {
  const [scrollPct, setScrollPct] = useState(0);
  const [activePipe, setActivePipe] = useState(0);
  const [activeFeature, setActiveFeature] = useState<FeatureIconName>('network');
  const [featureScrollPct, setFeatureScrollPct] = useState(20);
  const [fiturPinState, setFiturPinState] = useState<'top' | 'fixed' | 'bottom'>('top');
  const fiturTrackRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setScrollPct(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);

      const track = fiturTrackRef.current;
      if (track && window.innerWidth > 1120) {
        const rect = track.getBoundingClientRect();
        const navOffset = 76;
        const stickyHeight = window.innerHeight - navOffset;
        const scrollable = rect.height - stickyHeight;

        if (rect.top > navOffset) {
          setFiturPinState((prev) => (prev === 'top' ? prev : 'top'));
          setActiveFeature((prev) => (prev === FEATURES[0].id ? prev : FEATURES[0].id));
          setFeatureScrollPct(20);
        } else if (rect.bottom >= window.innerHeight) {
          setFiturPinState((prev) => (prev === 'fixed' ? prev : 'fixed'));
          if (scrollable > 0) {
            const raw = (navOffset - rect.top) / scrollable;
            const clamped = Math.min(0.999, Math.max(0, raw));
            const idx = Math.min(FEATURES.length - 1, Math.floor(clamped * FEATURES.length));
            const nextId = FEATURES[idx].id;
            setActiveFeature((prev) => (prev === nextId ? prev : nextId));
            setFeatureScrollPct(Math.min(100, Math.max(15, ((idx + 1) / FEATURES.length) * 100)));
          }
        } else {
          setFiturPinState((prev) => (prev === 'bottom' ? prev : 'bottom'));
          const lastId = FEATURES[FEATURES.length - 1].id;
          setActiveFeature((prev) => (prev === lastId ? prev : lastId));
          setFeatureScrollPct(100);
        }
      } else {
        setFiturPinState((prev) => (prev === 'top' ? prev : 'top'));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const selectFeature = (id: FeatureIconName, idx: number) => {
    setActiveFeature(id);
    setFeatureScrollPct(((idx + 1) / FEATURES.length) * 100);
    const track = fiturTrackRef.current;
    if (track && window.innerWidth > 1120) {
      const rect = track.getBoundingClientRect();
      const navOffset = 76;
      const stickyHeight = window.innerHeight - navOffset;
      const scrollable = rect.height - stickyHeight;
      if (scrollable > 0) {
        const trackTop = window.scrollY + rect.top - navOffset;
        const targetY = trackTop + ((idx + 0.15) / FEATURES.length) * scrollable;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    }
  };

  const currentFeature = FEATURES.find((f) => f.id === activeFeature) || FEATURES[0];
  const currentFeatureIdx = FEATURES.findIndex((f) => f.id === activeFeature);

  return (
    <div className="tl-landing">
      {/* ====================================================================
          TOP EDITORIAL NAVBAR (AEGIS-X Style + Scroll Progress Bar)
          ==================================================================== */}
      <header className="tl-nav">
        <div className="tl-scroll-progress" style={{ width: `${scrollPct}%` }} aria-hidden="true" />
        <div className="tl-nav-inner">
          <div className="tl-brand">
            <Logo />
            <span className="tl-nav-divider" aria-hidden="true" />
            <span className="tl-brand-tag">PUBLIC SIGNAL &amp; EVIDENCE INTEL</span>
          </div>

          <nav className="tl-nav-links" aria-label="Navigasi beranda">
            <a className="tl-nav-link" href="#alur" onClick={(e) => goTo(e, 'alur')}>
              01 Alur
            </a>
            <a className="tl-nav-link" href="#fitur" onClick={(e) => goTo(e, 'fitur')}>
              02 Konsol &amp; Fitur
            </a>
            <a className="tl-nav-link" href="#arsitektur" onClick={(e) => goTo(e, 'arsitektur')}>
              03 Arsitektur
            </a>
            <a className="tl-nav-link" href="#metodologi" onClick={(e) => goTo(e, 'metodologi')}>
              04 Metodologi
            </a>
            <a className="tl-nav-link" href="#faq" onClick={(e) => goTo(e, 'faq')}>
              05 FAQ
            </a>
          </nav>

          <div className="tl-nav-actions">
            <a className="tl-btn tl-btn-outline" href="#/data">
              Data &amp; AI
            </a>
            <a className="tl-btn tl-btn-blue" href="#/collected">
              Buka Workspace <span className="tl-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {/* ==================================================================
            HERO SECTION (2-Column Editorial + 3-Column Live Inspection Panel)
            ================================================================== */}
        <section className="tl-hero">
          <div className="tl-hero-bg" aria-hidden="true" />
          <div className="tl-hero-grid-overlay" aria-hidden="true" />
          <div className="tl-container">
            <div className="tl-hero-grid">
              {/* Left Column: Editorial Copy */}
              <div className="tl-hero-copy">
                <div className="tl-eyebrow">INTELIJEN PERCAKAPAN PUBLIK &amp; VERIFIKASI BUKTI</div>
                <h1 className="tl-hero-title">
                  Telusuri Percakapan.
                  <strong>
                    Periksa <em>Buktinya</em> Secara Presisi.
                  </strong>
                </h1>
                <p className="tl-hero-lead">
                  Platform analitik dan forensik informasi publik yang memetakan jaringan percakapan asli, melacak
                  pergeseran narasi, menguji indikasi koordinasi, dan menyusun brief investigasi berbasis bukti dengan{' '}
                  <strong>Mesin Sintesis AI Terikat Sitasi</strong>.
                </p>

                <div className="tl-hero-cta-group">
                  <a className="tl-btn tl-btn-blue tl-btn-lg" href="#/collected">
                    Mulai Investigasi <span className="tl-arrow" aria-hidden="true">→</span>
                  </a>
                  <a className="tl-btn tl-btn-outline tl-btn-lg" href="#alur" onClick={(e) => goTo(e, 'alur')}>
                    Lihat Alur Arsitektur
                  </a>
                </div>

                <div className="tl-hero-tech-bar">
                  <span className="tl-tech-bar-label">DIDUKUNG OLEH STACK TEKNOLOGI &amp; PROTOKOL TERBUKA RESMI</span>
                  <div className="tl-tech-logo-row" role="list" aria-label="Teknologi dan produk pendukung TELISIK">
                    {TECH_STACK_ITEMS.slice(0, 8).map((item) => (
                      <span key={item.id} className="tl-tech-chip" role="listitem" title={`${item.name} — ${item.detail}`}>
                        <span className="tl-tech-chip-icon">
                          <StackLogo name={item.id} />
                        </span>
                        <span className="tl-tech-chip-text">
                          <strong className="tl-tech-chip-name">{item.name}</strong>
                          <small className="tl-tech-chip-role">{item.role}</small>
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive 3-Column Inspection Workbench */}
              <HeroInspectionWorkbench />
            </div>
          </div>
        </section>

        {/* ==================================================================
            4-COLUMN KEY METRICS TICKER STRIP (AEGIS-X Style)
            ================================================================== */}
        <section className="tl-ticker-strip" aria-label="Ringkasan metrik platform">
          <div className="tl-container">
            <div className="tl-ticker-grid">
              <div className="tl-ticker-cell">
                <div className="tl-ticker-num">
                  <NumberTicker value={publicPosts.length} />
                  <span className="tl-unit">Post</span>
                </div>
                <div className="tl-ticker-label">Snapshot Publik Bluesky Asli</div>
                <div className="tl-ticker-sub">
                  {snapshotCounts.primary} post kata kunci &amp; {snapshotCounts.context} konteks balasan dengan tautan
                  sumber utuh
                </div>
              </div>

              <div className="tl-ticker-cell">
                <div className="tl-ticker-num">
                  <NumberTicker value={5} />
                  <span className="tl-unit">Modul</span>
                </div>
                <div className="tl-ticker-label">Alur Investigasi Terintegrasi</div>
                <div className="tl-ticker-sub">
                  Network, Narrative DNA, Coordination Fingerprint, Evidence Review &amp; Impact Review
                </div>
              </div>

              <div className="tl-ticker-cell">
                <div className="tl-ticker-num">
                  <NumberTicker value={637} />
                  <span className="tl-unit">Event</span>
                </div>
                <div className="tl-ticker-label">Korpus Studi Kasus Terstruktur</div>
                <div className="tl-ticker-sub">
                  4 skenario uji coba lengkap dengan pemisahan tegas antara data asli dan simulasi
                </div>
              </div>

              <div className="tl-ticker-cell">
                <div className="tl-ticker-num">
                  100<span className="tl-unit">%</span>
                </div>
                <div className="tl-ticker-label">Sintesis Brief AI Terikat Bukti</div>
                <div className="tl-ticker-sub">
                  Setiap temuan eksekutif wajib menyertakan sitasi langsung ke ID bukti sumber
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 01: ANIMATED ARCHITECTURAL TELEMETRY & 5-STAGE PIPELINE
            ================================================================== */}
        <section id="alur" className="tl-section tl-bg-stone">
          <div className="tl-container">
            <div className="tl-section-head">
              <div>
                <div className="tl-eyebrow">01 / Arsitektur Alur Investigasi</div>
                <h2 className="tl-section-title">
                  Dari Sinyal Mentah Menjadi
                  <strong>Keputusan Berbasis Bukti.</strong>
                </h2>
              </div>
              <p className="tl-section-desc">
                TELISIK menghubungkan lima tahapan pemeriksaan informasi publik dalam satu rantai bukti yang utuh.
                Arahkan kursor atau klik salah satu tahapan di bawah untuk menyorot telemetri arsitekturnya.
              </p>
            </div>

            {/* Animated Architectural Telemetry SVG Box */}
            <div className="tl-motion-diagram-box">
              <div className="tl-motion-diagram-head">
                <div className="tl-motion-diagram-title">
                  <span className="tl-live-dot" />
                  <span>TELEMETRI ALUR DATA — JETSTREAM &amp; KORPUS KE MESIN SINTESIS AI</span>
                </div>
                <div className="tl-motion-legend">
                  <span>
                    <i className="tl-swatch" style={{ background: '#2457E7' }} /> Akuisisi &amp; Graf Reply
                  </span>
                  <span>
                    <i className="tl-swatch" style={{ background: '#008E78' }} /> Forensik Narasi &amp; Pola
                  </span>
                  <span>
                    <i className="tl-swatch" style={{ background: '#0284C7' }} /> Sintesis AI &amp; Evaluasi
                  </span>
                </div>
              </div>

              <svg
                className="tl-arch-svg"
                viewBox="0 0 1160 225"
                role="img"
                aria-label="Diagram alur lima tahap investigasi TELISIK"
              >
                <defs>
                  <pattern id="tlArchDots" width="18" height="18" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#CBD5E1" opacity="0.6" />
                  </pattern>
                </defs>

                {/* Dot Matrix Background */}
                <rect x="0" y="0" width="1160" height="225" rx="6" fill="url(#tlArchDots)" />

                {/* Zone I & Zone II Backdrops */}
                <rect
                  x="14"
                  y="14"
                  width="668"
                  height="197"
                  rx="6"
                  fill="#F8FAFC"
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
                <text
                  x="28"
                  y="34"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  fontWeight="600"
                  fill="#65758B"
                  letterSpacing="0.08em"
                >
                  ZONA I — AKUISISI SINYAL, PEMODELAN GRAF &amp; FORENSIK POLA
                </text>

                <rect
                  x="696"
                  y="14"
                  width="450"
                  height="197"
                  rx="6"
                  fill="#EFF6FF"
                  fillOpacity="0.55"
                  stroke="#BFDBFE"
                  strokeDasharray="4 4"
                />
                <text
                  x="712"
                  y="34"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  fontWeight="600"
                  fill="#2457E7"
                  letterSpacing="0.08em"
                >
                  ZONA II — ARENA BUKTI, SINTESIS BRIEF AI &amp; AUDIT DAMPAK
                </text>

                {/* Base Conduits & Animated Flow Streams */}
                <path d="M 210 118 L 252 118" stroke="#CBD5E1" strokeWidth="2" fill="none" />
                <path d="M 210 118 L 252 118" stroke="#2457E7" className="tl-flow-stream" />

                <path d="M 432 118 L 474 118" stroke="#CBD5E1" strokeWidth="2" fill="none" />
                <path d="M 432 118 L 474 118" stroke="#2457E7" className="tl-flow-stream is-fast" />

                <path d="M 654 118 L 716 118" stroke="#CBD5E1" strokeWidth="2" fill="none" />
                <path d="M 654 118 L 716 118" stroke="#008E78" className="tl-flow-stream" />

                <path d="M 896 118 L 942 118" stroke="#CBD5E1" strokeWidth="2" fill="none" />
                <path d="M 896 118 L 942 118" stroke="#0284C7" className="tl-flow-stream is-fast" />

                {/* Stage 01 Node */}
                <g
                  className={`tl-arch-node ${activePipe === 0 ? 'is-highlighted' : ''}`}
                  onMouseEnter={() => setActivePipe(0)}
                  onClick={() => setActivePipe(0)}
                >
                  <rect
                    className="tl-arch-box"
                    x="30"
                    y="62"
                    width="180"
                    height="112"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                  />
                  <rect x="30" y="62" width="180" height="4" rx="2" fill="#2457E7" />
                  <text x="46" y="86" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#2457E7">
                    01 / INGESTION
                  </text>
                  <text x="46" y="108" fontSize="13" fontWeight="700" fill="#12213D">
                    Koleksi &amp; Kurasi
                  </text>
                  <text x="46" y="128" fontSize="10.5" fill="#425570">
                    Bluesky Jetstream v2
                  </text>
                  <text x="46" y="146" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#65758B">
                    SQLite WAL · AT-URI
                  </text>
                </g>

                {/* Stage 02 Node */}
                <g
                  className={`tl-arch-node ${activePipe === 1 ? 'is-highlighted' : ''}`}
                  onMouseEnter={() => setActivePipe(1)}
                  onClick={() => setActivePipe(1)}
                >
                  <rect
                    className="tl-arch-box"
                    x="252"
                    y="62"
                    width="180"
                    height="112"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                  />
                  <rect x="252" y="62" width="180" height="4" rx="2" fill="#2457E7" />
                  <text x="268" y="86" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#2457E7">
                    02 / NETWORK GRAPH
                  </text>
                  <text x="268" y="108" fontSize="13" fontWeight="700" fill="#12213D">
                    Conversation Network
                  </text>
                  <text x="268" y="128" fontSize="10.5" fill="#425570">
                    Reply &amp; Quote Graph
                  </text>
                  <text x="268" y="146" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#65758B">
                    Louvain Communities
                  </text>
                </g>

                {/* Stage 03 Node */}
                <g
                  className={`tl-arch-node ${activePipe === 2 ? 'is-highlighted' : ''}`}
                  onMouseEnter={() => setActivePipe(2)}
                  onClick={() => setActivePipe(2)}
                >
                  <rect
                    className="tl-arch-box"
                    x="474"
                    y="62"
                    width="180"
                    height="112"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                  />
                  <rect x="474" y="62" width="180" height="4" rx="2" fill="#008E78" />
                  <text x="490" y="86" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#008E78">
                    03 / FORENSICS
                  </text>
                  <text x="490" y="108" fontSize="13" fontWeight="700" fill="#12213D">
                    DNA &amp; Fingerprint
                  </text>
                  <text x="490" y="128" fontSize="10.5" fill="#425570">
                    Mutasi Teks &amp; Jendela
                  </text>
                  <text x="490" y="146" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#65758B">
                    Diff Spine · Co-Share
                  </text>
                </g>

                {/* Stage 04 Node */}
                <g
                  className={`tl-arch-node ${activePipe === 3 ? 'is-highlighted' : ''}`}
                  onMouseEnter={() => setActivePipe(3)}
                  onClick={() => setActivePipe(3)}
                >
                  <rect
                    className="tl-arch-box"
                    x="716"
                    y="62"
                    width="180"
                    height="112"
                    rx="6"
                    fill="#12213D"
                    stroke="#2457E7"
                    strokeWidth="1.5"
                  />
                  <rect x="716" y="62" width="180" height="4" rx="2" fill="#2457E7" />
                  <text x="732" y="86" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#93C5FD">
                    04 / AI &amp; VERDICT
                  </text>
                  <text x="732" y="108" fontSize="13" fontWeight="700" fill="#FFFFFF">
                    Review &amp; Sintesis AI
                  </text>
                  <text x="732" y="128" fontSize="10.5" fill="#CBD5E1">
                    Uji Dokumen &amp; Sintesis
                  </text>
                  <text x="732" y="146" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#6EE7B7">
                    Sitasi Bukti Terverifikasi
                  </text>
                </g>

                {/* Stage 05 Node */}
                <g
                  className={`tl-arch-node ${activePipe === 4 ? 'is-highlighted' : ''}`}
                  onMouseEnter={() => setActivePipe(4)}
                  onClick={() => setActivePipe(4)}
                >
                  <rect
                    className="tl-arch-box"
                    x="942"
                    y="62"
                    width="188"
                    height="112"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                  />
                  <rect x="942" y="62" width="188" height="4" rx="2" fill="#0284C7" />
                  <text x="958" y="86" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#0284C7">
                    05 / IMPACT AUDIT
                  </text>
                  <text x="958" y="108" fontSize="13" fontWeight="700" fill="#12213D">
                    Impact Review
                  </text>
                  <text x="958" y="128" fontSize="10.5" fill="#425570">
                    Evaluasi Pra/Pasca Aksi
                  </text>
                  <text x="958" y="146" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#65758B">
                    Kontrol Pembanding
                  </text>
                </g>
              </svg>
            </div>

            {/* 5-Card AMMAN Expandable Pipeline Ribbon */}
            <div className="tl-pipeline-ribbon" role="list" aria-label="Tahapan alur kerja TELISIK">
              {PIPELINE_STEPS.map((step, idx) => (
                <div
                  key={step.num}
                  role="listitem"
                  className={`tl-pipe-step ${activePipe === idx ? 'is-active' : ''}`}
                  onMouseEnter={() => setActivePipe(idx)}
                  onClick={() => setActivePipe(idx)}
                >
                  <div
                    className="tl-pipe-step-bg"
                    style={{ backgroundImage: `url('${step.bg}')` }}
                    aria-hidden="true"
                  />
                  <div className="tl-pipe-content">
                    <div className="tl-pipe-num">
                      <span>
                        {step.num} / {step.tag}
                      </span>
                      <span>→</span>
                    </div>
                    <h3 className="tl-pipe-title">{step.title}</h3>
                    <p className="tl-pipe-desc">{step.desc}</p>
                  </div>
                  <div className="tl-pipe-detail">
                    <span>{step.detail}</span>
                    <a href={step.href} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', fontWeight: 700 }}>
                      Buka ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 02: SCROLL-DRIVEN 5-MODULE WORKBENCH (Fits in 1 Screen)
            ================================================================== */}
        <section id="fitur" ref={fiturTrackRef} className="tl-section-fitur-track">
          <div className={`tl-fitur-sticky is-pin-${fiturPinState}`}>
            <div className="tl-section-bg-grid" aria-hidden="true" />
            <div className="tl-container">
              {/* Compact 1-Screen Header + Posture Strip */}
              <div className="tl-fitur-compact-head">
                <div className="tl-fitur-title-wrap">
                  <div className="tl-eyebrow">02 / Konsol &amp; Simulasi Interaktif</div>
                  <h2 className="tl-fitur-compact-title">
                    Eksplorasi Langsung <strong>Lima Modul Investigasi.</strong>
                  </h2>
                </div>

                <div className="tl-fitur-posture-strip" aria-label="Ringkasan kapabilitas konsol">
                  <div className="tl-posture-pill">
                    <span className="tl-posture-val is-blue">100%</span>
                    <div>
                      <strong>Keterlacakan Sumber</strong>
                      <small>Provenans garis graf asli</small>
                    </div>
                  </div>
                  <div className="tl-posture-pill">
                    <span className="tl-posture-val is-teal">5/5</span>
                    <div>
                      <strong>Workbench Forensik</strong>
                      <small>Jaringan hingga dampak</small>
                    </div>
                  </div>
                  <div className="tl-posture-pill">
                    <span className="tl-posture-val is-sky">AI+</span>
                    <div>
                      <strong>Sintesis Terikat Bukti</strong>
                      <small>Sitasi nomor bukti otomatis</small>
                    </div>
                  </div>
                  <div className="tl-scroll-hint-pill" aria-hidden="true">
                    <span className="tl-scroll-mouse">⇣</span>
                    <span>Gulir layar untuk ganti modul ({currentFeatureIdx + 1}/5)</span>
                  </div>
                </div>
              </div>

              {/* Interactive 5-Module Sandbox Workbench */}
              <div className="tl-workbench-shell">
                <div className="tl-workbench-tabs">
                  <div className="tl-workbench-tab-list" role="tablist" aria-label="Pilih modul simulasi">
                    {FEATURES.map((feat, idx) => (
                      <button
                        key={feat.id}
                        type="button"
                        role="tab"
                        aria-selected={activeFeature === feat.id}
                        className={`tl-wb-tab ${activeFeature === feat.id ? 'is-active' : ''}`}
                        onClick={() => selectFeature(feat.id, idx)}
                      >
                        <CustomIcon name={feat.id} size={16} />
                        <span>{feat.short}</span>
                        <small>{feat.real ? 'ASLI' : 'KASUS'}</small>
                      </button>
                    ))}
                  </div>
                  <a className="tl-wb-open-link" href={currentFeature.href}>
                    Buka {currentFeature.name} Penuh <span className="tl-arrow">→</span>
                  </a>
                </div>

                {/* Live Scroll Progress Bar Across the 5 Modules */}
                <div className="tl-wb-scroll-bar" aria-hidden="true">
                  <div className="tl-wb-scroll-fill" style={{ width: `${featureScrollPct}%` }} />
                </div>

                <div className="tl-workbench-body" key={activeFeature}>
                  <div className="tl-workbench-copy">
                    <div className="tl-wb-copy-top">
                      <div className="tl-wb-badge-row">
                        <span className="tl-wb-index">MODUL 0{currentFeatureIdx + 1} / 05</span>
                        <span className={`tl-wb-badge ${currentFeature.real ? 'is-real' : 'is-case'}`}>
                          {currentFeature.real ? '● Snapshot Publik Asli' : '◆ Studi Kasus Terstruktur'}
                        </span>
                      </div>

                      <div className="tl-wb-heading-row">
                        <CustomIcon name={currentFeature.id} size={36} className="tl-wb-module-icon" />
                        <div>
                          <span className="tl-wb-module-name">{currentFeature.name}</span>
                          <h3>{currentFeature.title}</h3>
                        </div>
                      </div>

                      <p className="tl-wb-desc">{currentFeature.description}</p>
                      <div className="tl-wb-detail-box">{currentFeature.detail}</div>

                      <div className="tl-wb-specs-grid" aria-label="Spesifikasi teknis modul">
                        {currentFeature.specs.map(([label, val]) => (
                          <div className="tl-wb-spec-cell" key={label}>
                            <span className="tl-wb-spec-k">{label}</span>
                            <span className="tl-wb-spec-v">{val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="tl-wb-guide-card">
                        <span className="tl-wb-guide-tag">✦ PANDUAN INTERAKSI PANEL KANAN</span>
                        <p>{currentFeature.guide}</p>
                      </div>
                    </div>

                    <div className="tl-wb-copy-actions">
                      <a className="tl-btn tl-btn-blue" href={currentFeature.href}>
                        {currentFeature.cta} <span className="tl-arrow">→</span>
                      </a>
                      <div className="tl-wb-step-Restore">
                        {FEATURES.map((f, idx) => (
                          <button
                            key={f.id}
                            type="button"
                            className={`tl-wb-dot-btn ${activeFeature === f.id ? 'is-active' : ''}`}
                            onClick={() => selectFeature(f.id, idx)}
                            aria-label={`Pindah ke modul ${idx + 1}: ${f.name}`}
                            title={f.name}
                          >
                            0{idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="tl-workbench-stage">
                    <div
                      className="tl-workbench-stage-bg"
                      style={{ backgroundImage: `url('${currentFeature.bg}')` }}
                      aria-hidden="true"
                    />
                    <div className="tl-stage-canvas">
                      {activeFeature === 'network' && <EvidencePreview />}
                      {activeFeature === 'narrative' && <NarrativePreview />}
                      {activeFeature === 'coordination' && <CoordinationPreview />}
                      {activeFeature === 'evidence' && <EvidenceReviewPreview />}
                      {activeFeature === 'impact' && <ImpactPreview />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 03: 3-COLUMN ARCHITECTURAL PILLARS (AEGIS-X Pillar Cards)
            ================================================================== */}
        <section id="arsitektur" className="tl-section tl-bg-stone">
          <div className="tl-container">
            <div className="tl-section-head">
              <div>
                <div className="tl-eyebrow">03 / Pilar Rekayasa Sistem</div>
                <h2 className="tl-section-title">
                  Fondasi Teknis untuk
                  <strong>Investigasi yang Dapat Diaudit.</strong>
                </h2>
              </div>
              <p className="tl-section-desc">
                Dibangun dengan pemisahan tegas antara pengumpulan bukti deterministik, analisis struktur jaringan, dan
                sintesis kecerdasan buatan yang terikat pada sitasi sumber.
              </p>
            </div>

            <div className="tl-pillars-grid">
              {/* Pillar 01 */}
              <article className="tl-pillar-card">
                <div className="tl-pillar-visual">
                  <div
                    className="tl-pillar-visual-bg"
                    style={{ backgroundImage: "url('/illustrations/telisik-hero-v15.webp')" }}
                    aria-hidden="true"
                  />
                  <span className="tl-pillar-visual-tag">GRAPHOLOGY · JETSTREAM</span>
                  <svg viewBox="0 0 360 184" aria-hidden="true">
                    <circle cx="95" cy="92" r="26" fill="rgba(36,87,231,0.22)" stroke="#2457E7" strokeWidth="1.5" />
                    <circle cx="95" cy="92" r="8" fill="#2457E7" />
                    <circle cx="215" cy="56" r="18" fill="rgba(0,142,120,0.22)" stroke="#008E78" strokeWidth="1.5" />
                    <circle cx="215" cy="56" r="6" fill="#008E78" />
                    <circle cx="255" cy="128" r="20" fill="rgba(2,132,199,0.22)" stroke="#38BDF8" strokeWidth="1.5" />
                    <circle cx="255" cy="128" r="6" fill="#38BDF8" />
                    <path d="M121 84 L197 61" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 4" />
                    <path d="M121 100 L235 123" stroke="#93C5FD" strokeWidth="1.5" />
                    <path d="M224 72 L248 110" stroke="#5EEAD4" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="24" y="164" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#93C5FD">
                      at://did:plc:root ──► Louvain Community #01
                    </text>
                  </svg>
                </div>
                <div className="tl-pillar-body">
                  <div>
                    <span className="tl-pillar-index">PILAR 01 / STRUKTUR JARINGAN</span>
                    <div className="tl-pillar-stack-row" aria-label="Stack Pilar 01">
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="bluesky" /> Bluesky
                      </span>
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="atproto" /> AT Protocol
                      </span>
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="graphology" /> Graphology
                      </span>
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="sqlite" /> SQLite
                      </span>
                    </div>
                    <h3 className="tl-pillar-title">Pemodelan Graf Percakapan Deterministik</h3>
                    <p className="tl-pillar-desc">
                      Menyusun topologi percakapan murni dari rujukan reply dan quote AT-Protocol tanpa menebak koneksi
                      dari kesamaan topik semata.
                    </p>
                  </div>
                  <div>
                    <div className="tl-pillar-specs">
                      <div className="tl-spec-item">
                        <span className="tl-spec-k">Sumber Sinyal</span>
                        <span className="tl-spec-v">Bluesky Jetstream v2</span>
                      </div>
                      <div className="tl-spec-item">
                        <span className="tl-spec-k">Deteksi Komunitas</span>
                        <span className="tl-spec-v">Graphology Louvain</span>
                      </div>
                      <div className="tl-spec-item">
                        <span className="tl-spec-k">Penyimpanan Lokal</span>
                        <span className="tl-spec-v">SQLite WAL Mode</span>
                      </div>
                    </div>
                    <a className="tl-pillar-link" href="#/collected">
                      Buka Conversation Network →
                    </a>
                  </div>
                </div>
              </article>

              {/* Pillar 02 */}
              <article className="tl-pillar-card">
                <div className="tl-pillar-visual">
                  <div
                    className="tl-pillar-visual-bg"
                    style={{ backgroundImage: "url('/illustrations/telisik-context-lens.png')" }}
                    aria-hidden="true"
                  />
                  <span className="tl-pillar-visual-tag">DIFF SPINE · TEMPORAL</span>
                  <svg viewBox="0 0 360 184" aria-hidden="true">
                    <rect x="34" y="42" width="120" height="32" rx="4" fill="rgba(255,255,255,0.07)" stroke="#64748B" />
                    <text x="46" y="62" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#E2E8F0">
                      V1: &quot;Apakah benar...&quot;
                    </text>
                    <rect x="196" y="42" width="130" height="32" rx="4" fill="rgba(36,87,231,0.28)" stroke="#60A5FA" />
                    <text x="208" y="62" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#FFFFFF">
                      V3: &quot;Resmi ditutup!&quot;
                    </text>
                    <path d="M154 58 L196 58" stroke="#60A5FA" strokeWidth="2" />
                    <rect x="34" y="98" width="292" height="38" rx="4" fill="rgba(0,142,120,0.18)" stroke="#2DD4BF" />
                    <text x="48" y="121" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#5EEAD4">
                      Co-Sharing Burst: Δt ≤ 300s (8 Pair Matches)
                    </text>
                  </svg>
                </div>
                <div className="tl-pillar-body">
                  <div>
                    <span className="tl-pillar-index">PILAR 02 / FORENSIK TEKS &amp; WAKTU</span>
                    <div className="tl-pillar-stack-row" aria-label="Stack Pilar 02">
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="react" /> React 19
                      </span>
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="typescript" /> TypeScript
                      </span>
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="d3" /> D3.js
                      </span>
                    </div>
                    <h3 className="tl-pillar-title">Pelacakan Mutasi Narasi &amp; Sidik Koordinasi</h3>
                    <p className="tl-pillar-desc">
                      Membedah bagaimana kalimat tanya berubah menjadi klaim viral sekaligus mengukur kepadatan berbagi
                      tautan berulang pada jendela waktu yang dapat diatur.
                    </p>
                  </div>
                  <div>
                    <div className="tl-pillar-specs">
                      <div className="tl-spec-item">
                        <span className="tl-spec-k">Lacak Pergeseran</span>
                        <span className="tl-spec-v">Word-Level Diff Spine</span>
                      </div>
                      <div className="tl-spec-item">
                        <span className="tl-spec-k">Uji Sensitivitas</span>
                        <span className="tl-spec-v">Jendela 5m · 10m · 15m</span>
                      </div>
                      <div className="tl-spec-item">
                        <span className="tl-spec-k">Prinsip Evaluasi</span>
                        <span className="tl-spec-v">Bukti Terbuka Non-Vonis</span>
                      </div>
                    </div>
                    <a className="tl-pillar-link" href="#/dna">
                      Buka Narrative DNA →
                    </a>
                  </div>
                </div>
              </article>

              {/* Pillar 03 */}
              <article className="tl-pillar-card">
                <div className="tl-pillar-visual">
                  <div
                    className="tl-pillar-visual-bg"
                    style={{ backgroundImage: "url('/feature-icons/evidence.webp')" }}
                    aria-hidden="true"
                  />
                  <span className="tl-pillar-visual-tag">AI BRIEF · CITATION ENGINE</span>
                  <svg viewBox="0 0 360 184" aria-hidden="true">
                    <rect x="40" y="38" width="280" height="108" rx="6" fill="rgba(36,87,231,0.18)" stroke="#3B82F6" />
                    <text x="58" y="64" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill="#93C5FD">
                      ✦ EVIDENCE-GROUNDED BRIEF SYNTHESIS
                    </text>
                    <text x="58" y="88" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#FFFFFF">
                      engine: telisik-neural-brief
                    </text>
                    <text x="58" y="108" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#6EE7B7">
                      citations: [post-01, doc-cendana-02]
                    </text>
                    <text x="58" y="128" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#CBD5E1">
                      status: Grounded &amp; Verified
                    </text>
                  </svg>
                </div>
                <div className="tl-pillar-body">
                  <div>
                    <span className="tl-pillar-index">PILAR 03 / SINTESIS AI &amp; AUDIT DAMPAK</span>
                    <div className="tl-pillar-stack-row" aria-label="Stack Pilar 03">
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="fastapi" /> FastAPI
                      </span>
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="python" /> Python
                      </span>
                      <span className="tl-pillar-stack-pill">
                        <StackLogo name="vite" /> Vite
                      </span>
                    </div>
                    <h3 className="tl-pillar-title">Brief Eksekutif Terikat Sitasi &amp; Evaluasi Aksi</h3>
                    <p className="tl-pillar-desc">
                      Menghasilkan laporan investigasi terstruktur melalui Mesin Sintesis AI dan memverifikasi
                      dampak tindakan klarifikasi dengan grup pembanding.
                    </p>
                  </div>
                  <div>
                    <div className="tl-pillar-specs">
                      <div className="tl-spec-item">
                        <span className="tl-spec-k">Mesin Sintesis</span>
                        <span className="tl-spec-v">TELISIK Neural Brief</span>
                      </div>
                      <div className="tl-spec-item">
                        <span className="tl-spec-k">Validasi Rujukan</span>
                        <span className="tl-spec-v">Sitasi AT-URI Terverifikasi</span>
                      </div>
                      <div className="tl-spec-item">
                        <span className="tl-spec-k">Audit Intervensi</span>
                        <span className="tl-spec-v">Pre/Post &amp; Kontrol</span>
                      </div>
                    </div>
                    <a className="tl-pillar-link" href="#/data">
                      Buka Data &amp; AI Workspace →
                    </a>
                  </div>
                </div>
              </article>
            </div>

            {/* Official Technology Stack & Open Protocol Showcase Ribbon */}
            <div className="tl-stack-showcase" aria-label="Ekosistem Teknologi dan Produk Resmi">
              <div className="tl-stack-head">
                <div className="tl-stack-head-left">
                  <span className="tl-stack-kicker">STACK &amp; EKOSISTEM TEKNOLOGI RESMI</span>
                  <h3 className="tl-stack-title">
                    Dibangun di Atas Protokol Terbuka, Mesin Graf Deterministik &amp; Runtime Modern
                  </h3>
                </div>
                <span className="tl-stack-sub">10 Produk &amp; Pustaka Inti Terverifikasi</span>
              </div>

              <div className="tl-stack-grid" role="list">
                {TECH_STACK_ITEMS.map((item) => (
                  <div key={item.id} className="tl-stack-card" role="listitem">
                    <div className="tl-stack-logo-box" aria-hidden="true">
                      <StackLogo name={item.id} />
                    </div>
                    <div className="tl-stack-meta">
                      <strong>{item.name}</strong>
                      <span>
                        {item.role} · {item.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 04: 4-COLUMN ANALYTICAL TAXONOMY (AEGIS-X Tier Cards)
            ================================================================== */}
        <section id="metodologi" className="tl-section">
          <div className="tl-container">
            <div className="tl-section-head">
              <div>
                <div className="tl-eyebrow">04 / Taksonomi &amp; Kejujuran Data</div>
                <h2 className="tl-section-title">
                  Empat Lapisan Verifikasi
                  <strong>Tanpa Klaim Berlebihan.</strong>
                </h2>
              </div>
              <p className="tl-section-desc">
                TELISIK memisahkan secara eksplisit mana data percakapan publik asli, mana aturan heuristik yang dapat
                diuji, mana sintesis AI, dan mana studi kasus simulasi.
              </p>
            </div>

            <div className="tl-tiers-grid">
              <div className="tl-tier-card" style={{ ['--tier-accent' as string]: '#008E78' }}>
                <span className="tl-tier-badge">LAPIS 01 · DATA ASLI</span>
                <h3 className="tl-tier-name">Snapshot Publik Bluesky</h3>
                <p className="tl-tier-desc">
                  Memuat {publicPosts.length} post publik asli seputar percakapan layanan publik Jakarta dengan rujukan
                  AT-URI dan tautan sumber yang dapat dibuka langsung.
                </p>
                <div className="tl-tier-policy">
                  <span>Cakupan &amp; Tanggal</span>
                  {capturedLabel} · {snapshotMetadata.keywords.slice(0, 3).join(', ')}
                </div>
              </div>

              <div className="tl-tier-card" style={{ ['--tier-accent' as string]: '#2457E7' }}>
                <span className="tl-tier-badge">LAPIS 02 · TRANSPARAN</span>
                <h3 className="tl-tier-name">Aturan Graf &amp; Heuristik Terbuka</h3>
                <p className="tl-tier-desc">
                  Tidak ada skor kotak hitam (black-box). Setiap pengelompokan komunitas, diff kalimat, dan matriks
                  jendela waktu dapat diperiksa parameternya oleh analis.
                </p>
                <div className="tl-tier-policy">
                  <span>Metode Verifikasi</span>
                  Interaktif · Ambang Dapat Diubah
                </div>
              </div>

              <div className="tl-tier-card" style={{ ['--tier-accent' as string]: '#0284C7' }}>
                <span className="tl-tier-badge">LAPIS 03 · SINTESIS AI</span>
                <h3 className="tl-tier-name">Sintesis Brief Terikat Bukti</h3>
                <p className="tl-tier-desc">
                  Mesin AI tidak mengambil vonis sepihak, melainkan merangkum sinyal, mengutip ID bukti yang tersedia di
                  workspace, dan mencantumkan batasan analisis secara eksplisit.
                </p>
                <div className="tl-tier-policy">
                  <span>Mesin Sintesis</span>
                  TELISIK Neural Brief Engine
                </div>
              </div>

              <div className="tl-tier-card" style={{ ['--tier-accent' as string]: '#D97706' }}>
                <span className="tl-tier-badge">LAPIS 04 · SKENARIO UJI</span>
                <h3 className="tl-tier-name">Studi Kasus Berlabel Jelas</h3>
                <p className="tl-tier-desc">
                  Untuk menguji fitur Narrative DNA, Coordination Fingerprint, Evidence Review, dan Impact Review secara
                  mendalam, tersedia 4 korpus studi kasus terstruktur.
                </p>
                <div className="tl-tier-policy">
                  <span>Penandaan UI</span>
                  Badge &quot;Studi Kasus&quot; Eksplisit
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 05: EDITORIAL FAQ
            ================================================================== */}
        <section id="faq" className="tl-section tl-bg-stone">
          <div className="tl-container">
            <div className="tl-section-head">
              <div>
                <div className="tl-eyebrow">05 / Pertanyaan Umum &amp; Metodologi</div>
                <h2 className="tl-section-title">
                  Transparansi Sumber,
                  <strong>Batas Bukti &amp; Cara Kerja.</strong>
                </h2>
              </div>
              <p className="tl-section-desc">
                Penjelasan ringkas mengenai keaslian snapshot publik, peran Mesin Sintesis AI, serta cara
                menggunakan workspace untuk mengimpor data baru.
              </p>
            </div>

            <div className="tl-faq-grid">
              {FAQS.map(([q, a], idx) => (
                <details key={q} className="tl-faq-item" open={idx < 2}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================================
            EDITORIAL CTA BANNER (AEGIS-X Style)
            ================================================================== */}
        <section className="tl-cta-banner">
          <div className="tl-cta-bg" aria-hidden="true" />
          <div className="tl-cta-grid-overlay" aria-hidden="true" />
          <div className="tl-container">
            <div className="tl-cta-inner">
              <div className="tl-eyebrow">SIAP UNTUK MEMERIKSA BUKTI?</div>
              <h2 className="tl-cta-title">
                Masuk ke Ruang Investigasi{' '}
                <strong>TELISIK Sekarang.</strong>
              </h2>
              <p className="tl-cta-desc">
                Telusuri graf percakapan publik Bluesky asli, uji studi kasus pergeseran narasi, atau buat ringkasan
                eksekutif berbasis bukti dengan Mesin Sintesis AI.
              </p>
              <div className="tl-hero-cta-group" style={{ justifyContent: 'center' }}>
                <a className="tl-btn tl-btn-blue tl-btn-lg" href="#/collected">
                  Buka Conversation Network <span className="tl-arrow">→</span>
                </a>
                <a className="tl-btn tl-btn-outline-light tl-btn-lg" href="#/data">
                  Buka Data &amp; AI Workspace
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================================
          CORPORATE MULTI-COLUMN FOOTER
          ==================================================================== */}
      <footer className="tl-footer">
        <div className="tl-container">
          <div className="tl-footer-top">
            <div className="tl-footer-brand">
              <Logo />
              <p>
                Platform investigasi percakapan publik, forensik pergeseran narasi, dan evaluasi tindakan berbasis bukti
                dengan dukungan Mesin Sintesis AI terintegrasi.
              </p>
              <div className="tl-footer-stack-strip" aria-label="Stack teknologi utama">
                {(['bluesky', 'atproto', 'react', 'typescript', 'fastapi', 'python', 'sqlite', 'graphology'] as StackLogoName[]).map(
                  (id) => {
                    const info = TECH_STACK_ITEMS.find((t) => t.id === id)!;
                    return (
                      <span key={id} className="tl-footer-stack-badge">
                        <StackLogo name={id} />
                        <span>{info.name}</span>
                      </span>
                    );
                  },
                )}
              </div>
            </div>

            <div className="tl-footer-cols">
              <div className="tl-footer-col">
                <h4>Modul Investigasi</h4>
                <ul>
                  {FEATURES.map((f) => (
                    <li key={f.id}>
                      <a href={f.href}>{f.name}</a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tl-footer-col">
                <h4>Data &amp; Mesin AI</h4>
                <ul>
                  <li>
                    <a href="#/data">Data &amp; AI Workspace</a>
                  </li>
                  <li>
                    <a href="#/case">Studi Kasus Jaringan</a>
                  </li>
                  <li>
                    <a href="#/collector">Kolektor Bluesky</a>
                  </li>
                </ul>
              </div>

              <div className="tl-footer-col">
                <h4>Navigasi Halaman</h4>
                <ul>
                  <li>
                    <a href="#alur" onClick={(e) => goTo(e, 'alur')}>
                      01 Arsitektur Alur
                    </a>
                  </li>
                  <li>
                    <a href="#fitur" onClick={(e) => goTo(e, 'fitur')}>
                      02 Konsol &amp; Fitur
                    </a>
                  </li>
                  <li>
                    <a href="#arsitektur" onClick={(e) => goTo(e, 'arsitektur')}>
                      03 Pilar Sistem
                    </a>
                  </li>
                  <li>
                    <a href="#metodologi" onClick={(e) => goTo(e, 'metodologi')}>
                      04 Taksonomi Data
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="tl-footer-bottom">
            <span>© 2026 TELISIK — Public Conversation &amp; Evidence Intelligence Platform.</span>
            <span>Didukung oleh Bluesky Public Snapshot · SQLite WAL · Mesin Sintesis AI Terikat Bukti</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;


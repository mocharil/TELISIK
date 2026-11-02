import LensLoader from './lens-loader';
import SourceControl from './source-control';
import { CollectionOverview } from './collection-overview';
import { ActiveProjectBanner } from './topic-projects';
import { LOCAL_API } from './runtime';
import { capturedLabel, snapshotCounts } from './public-snapshot';
import { Link } from './link';
import { api, briefDownload } from './demo';
import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Search,
  Network,
  FileText,
  FlaskConical,
  Radio,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Check,
  X,
  CircleHelp,
  ExternalLink,
  Play,
  Sparkles,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { Post, Cluster, Overview, Sources, Brief, Simulation } from './types';
import { PageActions } from './page-actions';
import { FeatureRibbon, MetricCards, NetworkVisual, SignalOrb } from './visuals';
import { UiBadge, UiButton, UiModal, UiSelect } from './ui-primitives';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, caption: 'The conversation, in context.' },
  { id: 'posts', label: 'Post Explorer', icon: Search, caption: 'Start with what people actually said.' },
  { id: 'coordination', label: 'Investigation Lab', icon: Network, caption: 'Inspect patterns. Follow the evidence.' },
  { id: 'briefs', label: 'Evidence & Briefs', icon: FileText, caption: 'From observations to a reviewable brief.' },
  { id: 'simulation', label: 'Simulation Lab', icon: FlaskConical, caption: 'Change the conditions. See what the rules catch.' },
  { id: 'sources', label: 'Source Health', icon: Radio, caption: 'Know exactly what your collection covers.' },
];

const number = (value: number) => new Intl.NumberFormat('id-ID').format(value);
const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      })
    : 'Belum ada aktivitas';
const short = (value: string) =>
  value.startsWith('did:example:') ? value.replace('did:example:', '@') : `${value.slice(0, 20)}…`;
const cleanProvider = (p?: string) =>
  (p || '').replace(/Vertex AI Gemini.*|Gemini.*/i, 'TELISIK AI Synthesis Engine');

function Empty({ text = 'Belum ada rekaman bukti pada tampilan ini.' }: { text?: string }) {
  return (
    <div className="dw-empty-state">
      <CircleHelp size={22} />
      <p>{text}</p>
    </div>
  );
}

function Badge({ children, blue = false }: { children: React.ReactNode; blue?: boolean }) {
  return <span className={`r-badge ${blue ? 'r-blue' : ''}`}>{children}</span>;
}

function Metrics({ items }: { items: { label: string; value: string | number; detail: string }[] }) {
  return <MetricCards items={items} />;
}

function PostCard({ post, onSelect }: { post: Post; onSelect?: () => void }) {
  const displayHandle = post.handle.startsWith('did:') ? short(post.did) : `@${post.handle.replace(/^@/, '')}`;
  const avatarText = post.handle.startsWith('did:')
    ? null
    : post.handle.replace(/^@/, '').slice(0, 2).toUpperCase();

  return (
    <article className="dw-post-card">
      <div className="dw-post-head">
        <div className="dw-post-author">
          <span
            className={`dw-post-avatar is-${
              post.topic === 'Environment' ? 'teal' : post.topic === 'Flooding' ? 'blue' : 'navy'
            }`}
          >
            {avatarText || <Fingerprint size={14} />}
          </span>
          <div>
            <strong title={post.did}>{displayHandle}</strong>
            <small>{date(post.created_at)} WIB</small>
          </div>
        </div>
        <div className="dw-post-badges">
          <UiBadge variant="topic">{post.topic}</UiBadge>
          <span className="dw-post-origin">
            {post.origin === 'synthetic'
              ? 'Sampel Simulasi'
              : post.context_only
              ? 'Balasan Konteks'
              : 'Cocok Kata Kunci'}
          </span>
        </div>
      </div>

      <p className="dw-post-text">{post.text}</p>

      <div className="dw-post-foot">
        <div className="dw-post-meta-tags">
          <span>Bahasa: {(post.langs || []).join(', ').toUpperCase() || 'ID'}</span>
          {post.matched_keywords && post.matched_keywords.length > 0 && (
            <span>Kata kunci: {post.matched_keywords.slice(0, 4).join(', ')}</span>
          )}
        </div>
        <div className="dw-post-actions">
          {onSelect && (
            <UiButton variant="ghost" size="xs" onClick={onSelect}>
              Periksa Detail <ArrowUpRight size={13} />
            </UiButton>
          )}
          {post.url && (
            <UiButton variant="ghost" size="xs" href={post.url}>
              Buka Sumber <ExternalLink size={13} />
            </UiButton>
          )}
        </div>
      </div>
    </article>
  );
}

function Graph({ cluster }: { cluster: Cluster }) {
  return <NetworkVisual cluster={cluster} />;
}

export default function Workspace({
  view,
  active = true,
  embedded = false,
  onNavigateProjects,
}: {
  view: string;
  active?: boolean;
  embedded?: boolean;
  onNavigateProjects?: () => void;
}) {
  const current = navigation.find(item => item.id === view) || navigation[0];
  const syntheticWorkspace = ['briefs', 'simulation'].includes(view);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [source, setSource] = useState<Sources | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([api<Overview>('overview'), api<Sources>('sources')]);
      setOverview(o);
      setSource(s);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (active) refresh();
  }, [refresh, revision, active]);

  useEffect(() => {
    const onProjectChange = () => setRevision(n => n + 1);
    window.addEventListener('telisik-project-change', onProjectChange);
    return () => window.removeEventListener('telisik-project-change', onProjectChange);
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [refresh, active]);

  async function action(fn: () => Promise<unknown>, message?: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      if (message) setNotice(message);
      setRevision(n => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`risara ${embedded ? 'is-embedded' : ''}`}>
      <main className="r-content">
        {!embedded && (
          <div className="r-heading">
            <div className="v-heading-main">
              <span className="v-page-icon">
                <current.icon size={23} strokeWidth={1.7} />
              </span>
              <div>
                <div className="r-eyebrow">JAKARTA / SIGNAL INTELLIGENCE</div>
                <h1>{current.label}</h1>
                <p>{current.caption}</p>
              </div>
            </div>
            <PageActions>
              <button
                onClick={() =>
                  action(
                    refresh,
                    LOCAL_API
                      ? 'Koleksi lokal berhasil diperbarui.'
                      : 'Snapshot publik berhasil dimuat ulang.'
                  )
                }
                disabled={busy}
              >
                <RefreshCw size={15} className={busy ? 'r-spin' : ''} />
                Segarkan Koleksi
              </button>
            </PageActions>
          </div>
        )}
        {error && (
          <div className="dw-alert is-error" role="alert">
            <span>{error}</span>
            <button aria-label="Tutup pesan error" onClick={() => setError('')}>
              <X size={15} />
            </button>
          </div>
        )}
        {notice && (
          <div className="dw-alert is-notice" role="status">
            <span>
              <Check size={15} /> {notice}
            </span>
            <button aria-label="Tutup notifikasi" onClick={() => setNotice('')}>
              <X size={15} />
            </button>
          </div>
        )}
        {!embedded && ['posts', 'overview', 'briefs', 'coordination'].includes(view) && (
          <ActiveProjectBanner onNavigateProjects={onNavigateProjects} />
        )}
        {!embedded && (
          <div
            className={`r-mode-note ${
              !syntheticWorkspace && source?.mode === 'snapshot' ? 'rs-provenance' : ''
            }`}
          >
            <span className={`r-dot ${source?.mode !== 'demo' ? 'r-online' : ''}`} />
            <strong>
              {!syntheticWorkspace && source?.mode === 'snapshot'
                ? 'Data asli · snapshot'
                : source?.mode === 'live'
                ? 'Koleksi live'
                : 'Workspace sampel'}
            </strong>
            <span>
              {!syntheticWorkspace && source?.mode === 'snapshot'
                ? `Ditangkap ${capturedLabel} · ${snapshotCounts.primary} cocok kata kunci + ${snapshotCounts.context} balasan konteks`
                : source?.mode === 'live'
                ? 'Post publik terfilter sesuai kata kunci.'
                : 'Menggunakan rekaman sampel terisolasi.'}
            </span>
            <Link href="/workspace/sources">
              Detail koleksi <ArrowRight size={13} />
            </Link>
          </div>
        )}
        {!overview || !source ? (
          <div className="r-loading">
            {error ? (
              'Gagal memuat data koleksi. Silakan coba muat ulang.'
            ) : (
              <LensLoader label="Memuat rekaman bukti project" />
            )}
          </div>
        ) : (
          <>
            {!embedded && !['posts', 'sources', 'overview'].includes(view) && (
              <FeatureRibbon view={view} />
            )}
            {view === 'overview' && <OverviewView data={overview} />}
            {view === 'posts' && (
              <PostsView
                revision={`${revision}-${source.mode}-${source.collector.last_event}`}
                topics={overview.topic_counts.map(t => t.topic)}
                report={setError}
              />
            )}
            {view === 'coordination' && (
              <CoordinationView
                revision={`${revision}-${source.mode}-${source.collector.last_event}`}
                action={action}
                report={setError}
                busy={busy}
              />
            )}
            {view === 'briefs' && (
              <BriefsView
                revision={`${revision}-${source.mode}`}
                source={source}
                action={action}
                busy={busy}
                report={setError}
              />
            )}
            {view === 'simulation' && <SimulationView action={action} busy={busy} />}
            {view === 'sources' && <SourceControl source={source} action={action} busy={busy} />}
          </>
        )}
      </main>
    </div>
  );
}

type Action = (fn: () => Promise<unknown>, message?: string) => Promise<void>;

function OverviewView({ data }: { data: Overview }) {
  return <CollectionOverview data={data} />;
}

function PostsView({
  revision,
  topics,
  report,
}: {
  revision: string;
  topics: string[];
  report: (s: string) => void;
}) {
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(1);
  const [language, setLanguage] = useState('');
  const [result, setResult] = useState<{ items: Post[]; total: number } | null>(null);
  const [selected, setSelected] = useState<Post | null>(null);

  useEffect(() => {
    let valid = true;
    const timer = setTimeout(() => {
      api<{ items: Post[]; total: number }>(
        `posts?${new URLSearchParams({ q, topic, page: String(page), limit: '10', language })}`
      )
        .then(r => {
          if (valid) setResult(r);
        })
        .catch(e => {
          if (valid) report(e.message);
        });
    }, 180);
    return () => {
      valid = false;
      clearTimeout(timer);
    };
  }, [q, topic, page, language, revision, report]);

  const totalPages = Math.max(1, Math.ceil((result?.total || 0) / 10));

  return (
    <div className="dw-tab-stack">
      <div className="dw-toolbar">
        <label className="dw-search-box">
          <Search size={15} />
          <input
            aria-label="Cari post bukti"
            placeholder="Cari isi post, kata kunci, atau nama akun (@handle)…"
            value={q}
            onChange={e => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          {q && (
            <button
              type="button"
              className="dw-search-clear"
              onClick={() => {
                setQ('');
                setPage(1);
              }}
              aria-label="Bersihkan pencarian"
            >
              <X size={13} />
            </button>
          )}
        </label>

        <div className="dw-toolbar-filters">
          <UiSelect
            aria-label="Filter topik"
            value={topic}
            onChange={e => {
              setTopic(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua Topik ({topics.length})</option>
            {topics.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </UiSelect>

          <UiSelect
            aria-label="Filter bahasa"
            value={language}
            onChange={e => {
              setLanguage(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua Bahasa</option>
            <option value="id">Bahasa Indonesia (ID)</option>
            <option value="en">Bahasa Inggris (EN)</option>
          </UiSelect>

          <UiBadge variant="code">{number(result?.total || 0)} POST</UiBadge>
        </div>
      </div>

      <section className="dw-list-panel">
        {result?.items.length ? (
          <div className="dw-post-list">
            {result.items.map(p => (
              <PostCard key={p.uri} post={p} onSelect={() => setSelected(p)} />
            ))}
          </div>
        ) : (
          <Empty
            text={
              result
                ? 'Tidak ada post bukti yang cocok dengan filter pencarian ini.'
                : 'Memuat daftar post bukti…'
            }
          />
        )}

        <div className="dw-pagination">
          <span>
            Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> · Menampilkan{' '}
            {result?.items.length || 0} dari {number(result?.total || 0)} post
          </span>
          <div className="dw-pagination-btns">
            <UiButton
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={14} /> Sebelumnya
            </UiButton>
            <UiButton
              variant="ghost"
              size="sm"
              disabled={page * 10 >= (result?.total || 0)}
              onClick={() => setPage(p => p + 1)}
            >
              Berikutnya <ChevronRight size={14} />
            </UiButton>
          </div>
        </div>
      </section>

      <UiModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        eyebrow="INSPEKSI METADATA BUKTI"
        title={selected ? `Rekaman Post @${selected.handle.replace(/^@/, '')}` : 'Detail Bukti'}
        description="Metadata publik asli tanpa inferensi lokasi maupun estimasi jangkauan spekulatif."
        size="lg"
        footer={
          <UiButton variant="secondary" size="sm" onClick={() => setSelected(null)}>
            Tutup Detail
          </UiButton>
        }
      >
        {selected && (
          <div className="dw-modal-evidence">
            <PostCard post={selected} />
            <dl className="dw-facts-grid">
              <div>
                <dt>URI Rekaman</dt>
                <dd>
                  <code>{selected.uri}</code>
                </dd>
              </div>
              <div>
                <dt>Identitas Akun (DID)</dt>
                <dd>
                  <code>{selected.did}</code>
                </dd>
              </div>
              <div>
                <dt>Waktu Publikasi</dt>
                <dd>{date(selected.created_at)} WIB</dd>
              </div>
              <div>
                <dt>Waktu Koleksi</dt>
                <dd>{date(selected.collected_at)} WIB</dd>
              </div>
              <div>
                <dt>Asal Rekaman</dt>
                <dd>{selected.origin}</dd>
              </div>
              <div>
                <dt>Cakupan Pencocokan</dt>
                <dd>
                  {selected.context_only
                    ? 'Balasan/kutipan konteks langsung'
                    : selected.matched_keywords?.join(', ') || 'Sampel project'}
                </dd>
              </div>
              <div>
                <dt>Tautan Terlampir</dt>
                <dd>
                  {selected.links.length
                    ? selected.links.map(l => (
                        <a key={l} href={l} rel="noreferrer" target="_blank">
                          {l} <ExternalLink size={12} />
                        </a>
                      ))
                    : 'Tidak ada tautan eksternal'}
                </dd>
              </div>
              <div>
                <dt>Relasi Percakapan</dt>
                <dd>{selected.reply_to || selected.quote_of || 'Post mandiri (standalone)'}</dd>
              </div>
            </dl>
          </div>
        )}
      </UiModal>
    </div>
  );
}

function CoordinationView({
  revision,
  action,
  busy,
  report,
}: {
  revision: string;
  action: Action;
  busy: boolean;
  report: (s: string) => void;
}) {
  const [minimum, setMinimum] = useState(3);
  const [windowSec, setWindowSec] = useState(300);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    let valid = true;
    api<{ clusters: Cluster[] }>(`coordination?minimum=${minimum}&window=${windowSec}`)
      .then(r => {
        if (valid) setClusters(r.clusters);
      })
      .catch(e => {
        if (valid) report(e.message);
      });
    return () => {
      valid = false;
    };
  }, [minimum, windowSec, revision, report]);

  const selected = clusters.find(c => c.id === selectedId) || clusters[0];

  return (
    <>
      <div className="r-filters">
        <label>
          Minimum akun{' '}
          <select
            aria-label="Minimum authors"
            value={minimum}
            onChange={e => setMinimum(+e.target.value)}
          >
            {[3, 5, 8, 10, 15].map(n => (
              <option key={n} value={n}>
                {n} akun
              </option>
            ))}
          </select>
        </label>
        <label>
          Rentang waktu{' '}
          <select
            aria-label="Time window"
            value={windowSec}
            onChange={e => setWindowSec(+e.target.value)}
          >
            <option value={60}>1 menit</option>
            <option value={300}>5 menit</option>
            <option value={900}>15 menit</option>
          </select>
        </label>
        <span>{clusters.length} kandidat pola</span>
      </div>
      <div className="r-radar-layout">
        <section className="r-panel">
          <div className="r-panel-header">
            <h2>Pola untuk Ditinjau</h2>
          </div>
          {clusters.length ? (
            clusters.map((c, i) => (
              <button
                key={c.id}
                className={`r-cluster ${selected?.id === c.id ? 'r-selected' : ''}`}
                onClick={() => setSelectedId(c.id)}
              >
                <span className="r-cluster-number">0{i + 1}</span>
                <div>
                  <strong>{c.label}</strong>
                  <p>
                    {c.authors} akun · {c.posts} post · {c.span_seconds} dtk
                  </p>
                  <Badge>{c.rule}</Badge>
                </div>
                <ChevronRight size={15} />
              </button>
            ))
          ) : (
            <Empty text="Belum ada pola yang melewati ambang batas ini." />
          )}
        </section>
        <section className="r-panel">
          {selected ? (
            <>
              <div className="r-panel-header">
                <div>
                  <h2>{selected.topic}</h2>
                  <p>
                    {selected.rule} · {date(selected.start)}
                  </p>
                </div>
                <Badge blue>Kandidat Tinjauan</Badge>
              </div>
              <Graph cluster={selected} />
              <div className="r-inline-metrics">
                <div>
                  <strong>{selected.authors}</strong>Akun berbeda
                </div>
                <div>
                  <strong>{selected.posts}</strong>Post cocok
                </div>
                <div>
                  <strong>{selected.span_seconds}s</strong>Rentang teramati
                </div>
              </div>
              <div className="r-panel-foot r-between">
                <span>Periksa bukti post sebelum menarik kesimpulan.</span>
                <UiButton
                  variant="primary"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    action(
                      () =>
                        api('briefs', 'POST', {
                          cluster_id: selected.id,
                          minimum,
                          window: windowSec,
                        }),
                      'Laporan brief berhasil disimpan.'
                    )
                  }
                >
                  <FileText size={14} /> Buat Brief
                </UiButton>
              </div>
            </>
          ) : (
            <Empty />
          )}
        </section>
      </div>
      {selected && (
        <section className="r-panel r-latest">
          <div className="r-panel-header">
            <div>
              <h2>Bukti Pendukung</h2>
              <p>Teks ternormalisasi atau tautan bersama dalam jendela waktu terpilih</p>
            </div>
            <span>{selected.posts} post</span>
          </div>
          {selected.evidence.map(p => (
            <PostCard post={p} key={p.uri} />
          ))}
        </section>
      )}
    </>
  );
}

function BriefsView({
  revision,
  source,
  action,
  busy,
  report,
}: {
  revision: string;
  source: Sources;
  action: Action;
  busy: boolean;
  report: (s: string) => void;
}) {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [gemini, setGemini] = useState(source.gemini_configured);

  useEffect(() => {
    setGemini(source.gemini_configured);
  }, [source.gemini_configured]);

  useEffect(() => {
    let valid = true;
    api<{ items: Brief[] }>('briefs')
      .then(r => {
        if (valid) setBriefs(r.items);
      })
      .catch(e => {
        if (valid) report(e.message);
      });
    return () => {
      valid = false;
    };
  }, [revision, report]);

  const b = briefs.find(item => item.id === selectedId) || briefs[0];

  return (
    <div className="dw-tab-stack">
      <div className="dw-toolbar">
        <div className="dw-toolbar-info">
          <UiBadge variant="code">
            {briefs.length > 1 ? `${briefs.length} VERSI LAPORAN` : 'LAPORAN AKTIF'}
          </UiBadge>
          {briefs.length > 1 ? (
            <div className="dw-brief-selector">
              <UiSelect
                aria-label="Pilih riwayat laporan brief"
                value={b?.id || ''}
                onChange={e => setSelectedId(e.target.value)}
              >
                {briefs.map((item, idx) => (
                  <option key={item.id} value={item.id}>
                    Versi #{briefs.length - idx} · {date(item.created_at)} WIB (
                    {item.status === 'Reviewed' ? 'Sudah Direview' : 'Draf'})
                  </option>
                ))}
              </UiSelect>
            </div>
          ) : (
            <span>
              Disusun otomatis dari rekaman bukti project aktif ·{' '}
              {LOCAL_API ? 'Tersimpan di database lokal SQLite' : 'Tersimpan di sesi browser'}
            </span>
          )}
        </div>

        <div className="dw-toolbar-actions">
          <label className="dw-ai-toggle">
            <input
              type="checkbox"
              checked={gemini}
              onChange={e => setGemini(e.target.checked)}
              disabled={!source.gemini_configured}
            />
            <Sparkles size={13} />
            <span>
              Sintesis AI {source.gemini_configured ? '(Aktif)' : '(Mode Template Deterministik)'}
            </span>
          </label>

          <UiButton
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() =>
              action(
                async () => {
                  const created = await api<Brief>('briefs', 'POST', { use_gemini: gemini });
                  setSelectedId(created.id);
                },
                'Versi laporan AI Brief terbaru berhasil disusun dari bukti project aktif.'
              )
            }
          >
            <RefreshCw size={14} className={busy ? 'r-spin' : ''} />
            {busy ? 'Menyusun Ulang…' : 'Perbarui / Buat Versi Baru'}
          </UiButton>
        </div>
      </div>

      <section className="dw-doc-panel" aria-label="Isi dokumen laporan brief">
        {b ? (
          <>
            <header className="dw-doc-topbar">
              <div className="dw-doc-topbar-left">
                <UiBadge variant={b.status === 'Reviewed' ? 'active' : 'topic'}>
                  {b.status === 'Reviewed' ? 'SUDAH DIREVIEW ANALIS' : 'DRAF · PERLU VERIFIKASI'}
                </UiBadge>
                <span>Dibuat {date(b.created_at)} WIB</span>
                <span className="dw-doc-provider">{cleanProvider(b.provider)}</span>
              </div>
              <div className="dw-doc-topbar-actions">
                <UiButton
                  variant="ghost"
                  size="xs"
                  href={briefDownload(b)}
                  // @ts-expect-error anchor download attribute passed via rest or handled by browser
                  download={`telisik-brief-${b.id}.md`}
                >
                  <Download size={13} /> Unduh .MD
                </UiButton>
                <UiButton
                  variant={b.status === 'Reviewed' ? 'selected' : 'primary'}
                  size="xs"
                  disabled={busy || b.status === 'Reviewed'}
                  onClick={() =>
                    action(
                      () => api(`briefs/${b.id}/review`, 'POST'),
                      'Status laporan berhasil ditandai sebagai Sudah Direview.'
                    )
                  }
                >
                  <Check size={13} />
                  {b.status === 'Reviewed' ? 'Terverifikasi' : 'Tandai Sudah Direview'}
                </UiButton>
              </div>
            </header>

            <div className="dw-doc-body">
              <div className="dw-doc-header-block">
                <span className="dw-doc-eyebrow">TELISIK · LAPORAN KAJIAN INTEGRITAS & BUKTI</span>
                <h2>{b.title}</h2>
                <div className="dw-doc-summary-box">
                  <p>{b.summary}</p>
                </div>
              </div>

              <section className="dw-doc-section">
                <h3>
                  <CheckCircle2 size={16} /> 1. Temuan Utama & Observasi Berbasis Sitasi
                </h3>
                <div className="dw-finding-list">
                  {b.findings.map((f, i) => (
                    <div className="dw-finding-card" key={i}>
                      <span className="dw-finding-num">0{i + 1}</span>
                      <div className="dw-finding-content">
                        <p>{f.text}</p>
                        {f.citations.length > 0 && (
                          <div className="dw-citations-row">
                            <span>Rujukan Bukti:</span>
                            {f.citations.map(uri => {
                              const idx = b.evidence.findIndex(p => p.uri === uri);
                              const labelIndex = idx >= 0 ? idx + 1 : 1;
                              return (
                                <a
                                  key={uri}
                                  href={`#evidence-${Math.max(0, idx)}`}
                                  className="dw-citation-pill"
                                  onClick={e => {
                                    e.preventDefault();
                                    document
                                      .getElementById(`evidence-${Math.max(0, idx)}`)
                                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }}
                                >
                                  [Bukti #{labelIndex}]
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="dw-doc-two-col">
                <section className="dw-doc-subbox is-warning">
                  <h3>
                    <AlertTriangle size={15} /> 2. Batasan Analisis
                  </h3>
                  <ul>
                    {b.limitations.map(x => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </section>

                <section className="dw-doc-subbox is-steps">
                  <h3>
                    <ListChecks size={15} /> 3. Rekomendasi Tindak Lanjut
                  </h3>
                  <ol>
                    {b.next_steps.map(x => (
                      <li key={x}>{x}</li>
                    ))}
                  </ol>
                </section>
              </div>

              <section className="dw-doc-section">
                <h3>4. Register Bukti Tersitasi ({b.evidence.length} Rekaman Post)</h3>
                <div className="dw-evidence-grid">
                  {b.evidence.map((p, i) => (
                    <article className="dw-evidence-card" key={p.uri} id={`evidence-${i}`}>
                      <div className="dw-evidence-card-top">
                        <span className="dw-evidence-idx">Bukti #{i + 1}</span>
                        <strong>@{p.handle ? p.handle.replace(/^@/, '') : short(p.did)}</strong>
                        <small>{date(p.created_at)}</small>
                      </div>
                      <p>{p.text}</p>
                      <div className="dw-evidence-card-foot">
                        <code>{p.uri}</code>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer">
                            Sumber <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <Empty text="Belum ada laporan untuk project ini. Klik 'Perbarui / Buat Versi Baru' di kanan atas." />
        )}
      </section>
    </div>
  );
}

function SimulationView({ action, busy }: { action: Action; busy: boolean }) {
  const [actors, setActors] = useState(12);
  const [interval, setInterval] = useState(8);
  const [minimum, setMinimum] = useState(3);
  const [windowSec, setWindowSec] = useState(300);
  const [result, setResult] = useState<Simulation | null>(null);

  useEffect(() => {
    let active = true;
    api<Simulation>('simulation', 'POST', {
      actors: 12,
      interval: 8,
      minimum: 3,
      window: 300,
      seed: 42,
    }).then(value => {
      if (active) setResult(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className="r-simulation-layout">
        <section className="r-panel r-controls">
          <div className="r-panel-header">
            <div>
              <h2>Build a scenario</h2>
              <p>Only fictional accounts and posts</p>
            </div>
          </div>
          <div className="r-control-body">
            <label>
              Participating authors <strong>{actors}</strong>
              <input
                type="range"
                min="2"
                max="60"
                value={actors}
                onChange={e => setActors(+e.target.value)}
              />
            </label>
            <label>
              Posting interval <strong>{interval}s</strong>
              <input
                type="range"
                min="1"
                max="600"
                value={interval}
                onChange={e => setInterval(+e.target.value)}
              />
            </label>
            <div className="r-rule-heading">DETECTION RULE</div>
            <label>
              Minimum authors
              <input
                type="number"
                min="2"
                max="30"
                value={minimum}
                onChange={e => setMinimum(+e.target.value)}
              />
            </label>
            <label>
              Window in seconds
              <input
                type="number"
                min="10"
                max="3600"
                value={windowSec}
                onChange={e => setWindowSec(+e.target.value)}
              />
            </label>
            <UiButton
              variant="primary"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  setResult(
                    await api<Simulation>('simulation', 'POST', {
                      actors,
                      interval,
                      minimum,
                      window: windowSec,
                      seed: 42,
                    })
                  );
                })
              }
            >
              <Play size={14} /> Run simulation
            </UiButton>
            <p className="r-caption">
              The scenario adds 30 unique control posts. Matching authors repeat one exact message.
            </p>
          </div>
        </section>
        <section className="r-panel">
          <div className="r-panel-header">
            <div>
              <h2>Scenario replay</h2>
              <p>Posting sequence in seconds from start</p>
            </div>
            <Badge>Isolated sandbox</Badge>
          </div>
          {result ? (
            <>
              <div className="r-chart r-replay-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={result.series}
                    margin={{ top: 15, right: 20, bottom: 5, left: -10 }}
                  >
                    <CartesianGrid vertical={false} stroke="#eee" />
                    <XAxis
                      dataKey="actor"
                      axisLine={false}
                      tickLine={false}
                      height={45}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`${v}s`, 'Posted at']} />
                    <Bar
                      dataKey="seconds"
                      fill="#1d5fbf"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="r-result-banner">
                <span className="r-dot r-online" />
                <strong>
                  {result.detected
                    ? `${result.detected} candidate pattern${result.detected === 1 ? '' : 's'} detected`
                    : 'No pattern passed the thresholds'}
                </strong>
                <span>
                  {result.flagged} of {result.total_posts} posts flagged
                </span>
              </div>
              <Metrics
                items={[
                  {
                    label: 'Precision',
                    value: `${Math.round(result.precision * 100)}%`,
                    detail: 'Synthetic benchmark only',
                  },
                  {
                    label: 'Recall',
                    value: `${Math.round(result.recall * 100)}%`,
                    detail: 'Known injected matches',
                  },
                  {
                    label: 'False positives',
                    value: result.false_positives,
                    detail: 'Unique control posts flagged',
                  },
                ]}
              />
              <div className="r-panel-foot">{result.note}</div>
            </>
          ) : (
            <div className="r-simulation-empty">
              <SignalOrb />
              <h3>A little experiment. A clearer signal.</h3>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

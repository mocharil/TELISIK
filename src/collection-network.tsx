import { useEffect, useMemo, useState } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from 'd3-force';
import {
  ArrowRight,
  Download,
  ExternalLink,
  Network,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { api } from './demo';
import { LOCAL_API } from './runtime';
import type { CollectionEdge, CollectionGraph } from './types';
import { PageActions } from './page-actions';
import { ToolHeading } from './investigation/lab-ui';
import { ActiveProjectBanner, AddDataModal, useActiveProject } from './topic-projects';
import { UiBadge, UiButton } from './ui-primitives';

type Positioned = SimulationNodeDatum & {
  id: string;
  label: string;
  posts: number;
  references: number;
};

function nodeColor(references: number, isHighlighted: boolean): string {
  if (isHighlighted) return '#1e40af';
  if (references >= 5) return '#2457e7'; // Hub Utama
  if (references >= 2) return '#7c3aed'; // Akun Jembatan / Diskusi Aktif
  return '#008e78'; // Partisipan / Pengutip & Pembalas
}

function ReferenceGraph({
  graph,
  selectEdge,
  selectedEdgeId,
  selectedNodeId,
  selectNode,
  onAddData,
}: {
  graph: CollectionGraph;
  selectEdge: (id: string | null) => void;
  selectedEdgeId: string | null;
  selectedNodeId: string | null;
  selectNode: (id: string | null) => void;
  onAddData: () => void;
}) {
  const layout = useMemo(() => {
    const connected = new Set(graph.edges.flatMap(e => [e.source, e.target]));
    const nodes: Positioned[] = graph.nodes
      .filter(n => connected.has(n.id))
      .map(n => ({ ...n }));
    const links = graph.edges.map(e => ({ source: e.source, target: e.target }));
    const isDense = nodes.length > 30;
    const simulation = forceSimulation(nodes)
      .force(
        'link',
        forceLink<Positioned, (typeof links)[number]>(links)
          .id(n => n.id)
          .distance(isDense ? 58 : 120)
      )
      .force('charge', forceManyBody().strength(isDense ? -145 : -380))
      .force('center', forceCenter(420, 240))
      .force('collide', forceCollide(isDense ? 18 : 42))
      .stop();
    simulation.tick(240);
    simulation.stop();
    return { nodes, links };
  }, [graph]);

  const minX = Math.min(0, ...layout.nodes.map(n => n.x! - 40));
  const minY = Math.min(0, ...layout.nodes.map(n => n.y! - 40));
  const maxX = Math.max(840, ...layout.nodes.map(n => n.x! + 40));
  const maxY = Math.max(480, ...layout.nodes.map(n => n.y! + 40));
  const map = new Map(layout.nodes.map(n => [n.id, n]));

  // Determine top hub nodes so we can label them cleanly without cluttering dense graphs
  const topHubIds = useMemo(() => {
    return new Set(
      [...layout.nodes]
        .sort((a, b) => b.references + b.posts - (a.references + a.posts))
        .slice(0, 12)
        .map(n => n.id)
    );
  }, [layout.nodes]);

  const activeEdge = graph.edges.find(e => e.id === selectedEdgeId);

  if (!layout.nodes.length) {
    return (
      <div className="lc-graph-empty">
        <Network size={40} />
        <h3>Belum ada pasangan koneksi terverifikasi pada sampel ini</h3>
        <p>
          {graph.posts
            ? `${graph.posts} post tersimpan, tetapi belum ada pasangan balasan (reply) atau kutipan (quote) yang kedua post-nya tersedia.`
            : 'Tarik atau tambahkan data terlebih dahulu untuk memetakan jaringan percakapan.'}
        </p>
        <UiButton variant="primary" size="md" onClick={onAddData}>
          <Plus size={14} /> Tambah Data ke Project
        </UiButton>
        <small>Teks yang identik tanpa reply/quote tidak pernah digambar sebagai garis koneksi semu.</small>
      </div>
    );
  }

  return (
    <svg
      className="lc-network-svg"
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      aria-label="Graf jaringan balasan dan kutipan eksplisit"
    >
      <defs>
        <marker
          id="collected-arrow"
          viewBox="0 0 10 10"
          refX="18"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#7b91b5" />
        </marker>
      </defs>

      {graph.edges.map(e => {
        const a = map.get(e.source);
        const b = map.get(e.target);
        if (!a || !b) return null;
        const curved = graph.edges.some(
          other => other.source === e.target && other.target === e.source
        );
        const dx = b.x! - a.x!;
        const dy = b.y! - a.y!;
        const length = Math.hypot(dx, dy) || 1;
        const d = `M ${a.x} ${a.y} Q ${(a.x! + b.x!) / 2 - (dy / length) * (curved ? 24 : 0)} ${
          (a.y! + b.y!) / 2 + (dx / length) * (curved ? 24 : 0)
        } ${b.x} ${b.y}`;
        const isEdgeSelected =
          selectedEdgeId === e.id ||
          (selectedNodeId !== null && (e.source === selectedNodeId || e.target === selectedNodeId));
        return (
          <g
            key={e.id}
            role="button"
            tabIndex={0}
            aria-label={`Inspeksi ${e.weight} referensi dari ${a.label} ke ${b.label}`}
            onClick={() => selectEdge(selectedEdgeId === e.id ? null : e.id)}
            onKeyDown={v => {
              if (v.key === 'Enter' || v.key === ' ') {
                v.preventDefault();
                selectEdge(selectedEdgeId === e.id ? null : e.id);
              }
            }}
          >
            <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
            <path
              d={d}
              fill="none"
              stroke={isEdgeSelected ? '#2457e7' : '#b2c2da'}
              strokeOpacity={
                selectedNodeId && !isEdgeSelected ? 0.25 : isEdgeSelected ? 0.95 : 0.72
              }
              strokeWidth={isEdgeSelected ? 2.6 : Math.min(2.2, 1 + (e.weight - 1) * 0.4)}
              markerEnd="url(#collected-arrow)"
            />
            <title>
              {a.label} → {b.label} ({e.weight} referensi eksplisit)
            </title>
          </g>
        );
      })}

      {layout.nodes.map(n => {
        const isNodeSelected =
          selectedNodeId === n.id ||
          activeEdge?.source === n.id ||
          activeEdge?.target === n.id;
        const showLabel =
          layout.nodes.length <= 28 || topHubIds.has(n.id) || isNodeSelected;
        const radius = Math.min(17, 5.5 + Math.sqrt(n.references * 1.8 + n.posts * 0.5) * 2);
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              selectNode(selectedNodeId === n.id ? null : n.id);
              selectEdge(null);
            }}
          >
            <circle
              r={isNodeSelected ? radius + 2.5 : radius}
              fill={nodeColor(n.references, isNodeSelected)}
              stroke={isNodeSelected ? '#0f172a' : '#fff'}
              strokeWidth={isNodeSelected ? 2.5 : 1.8}
            />
            <title>
              {n.label} · {n.posts} post · {n.references} rujukan masuk
            </title>
            {showLabel && (
              <text
                x={0}
                y={radius + 13}
                textAnchor="middle"
                fontSize={isNodeSelected ? 11.5 : 10}
                fontWeight={isNodeSelected || n.references >= 5 ? 700 : 500}
                fill={isNodeSelected ? '#0f172a' : '#294565'}
              >
                {n.label.replace(/\.bsky\.social$/, '')}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function CollectionNetwork() {
  const { activeProject, reload } = useActiveProject();
  const [graph, setGraph] = useState<CollectionGraph | null>(null);
  const [error, setError] = useState('');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'connections' | 'accounts'>('connections');
  const [showAddData, setShowAddData] = useState(false);

  async function refresh() {
    try {
      const g = await api<CollectionGraph>('network?limit=800');
      setGraph(g);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    const onProjectChange = () => {
      setSelectedEdgeId(null);
      setSelectedNodeId(null);
      refresh();
    };
    window.addEventListener('telisik-project-change', onProjectChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener('telisik-project-change', onProjectChange);
    };
  }, []);

  const edge = graph?.edges.find(e => e.id === selectedEdgeId);
  const selectedNode = graph?.nodes.find(n => n.id === selectedNodeId);

  const matches =
    graph?.edges.filter(e => {
      if (selectedNodeId && e.source !== selectedNodeId && e.target !== selectedNodeId) {
        return false;
      }
      const names = graph.nodes
        .filter(n => n.id === e.source || n.id === e.target)
        .map(n => n.label)
        .join(' ');
      return (
        !query ||
        (names + ' ' + e.source + ' ' + e.target).toLowerCase().includes(query.toLowerCase())
      );
    }) || [];

  function exportEvidence() {
    if (!graph) return;
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telisik-network-${activeProject?.code.toLowerCase() || 'global'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="investigation lf-shell">
      <main className="lf-main lc-network-page">
        <ToolHeading
          eyebrow="INVESTIGATION / NETWORK"
          title="Follow the references."
          accent="Inspect the evidence."
          description="Graf interaksi akun yang dibangun langsung dari rantai balasan (reply) dan kutipan (quote) pada project topik aktif Anda."
          icon={Network}
        />
        <ActiveProjectBanner />

        <PageActions>
          <UiButton variant="primary" size="md" onClick={() => setShowAddData(true)}>
            <Plus size={15} /> Tambah Data Project
          </UiButton>
          <UiButton variant="secondary" size="md" onClick={refresh}>
            <RefreshCw size={15} /> Segarkan Graf
          </UiButton>
          <UiButton variant="ghost" size="md" onClick={exportEvidence} disabled={!graph}>
            <Download size={15} /> Ekspor Bukti JSON
          </UiButton>
        </PageActions>

        <AddDataModal
          open={showAddData}
          project={activeProject}
          onClose={() => setShowAddData(false)}
          onUpdated={() => {
            reload();
            refresh();
          }}
        />

        {error && (
          <div className="lc-error" role="alert">
            {error}
            <UiButton variant="secondary" size="sm" onClick={refresh}>
              Coba Lagi
            </UiButton>
          </div>
        )}

        {graph ? (
          <>
            <div className="lc-numbers">
              <div>
                <span>Post dalam Cakupan Project</span>
                <strong>{graph.posts}</strong>
              </div>
              <div>
                <span>Pasangan Koneksi (Edges)</span>
                <strong>{graph.edges.length}</strong>
              </div>
              <div>
                <span>Akun Terhubung</span>
                <strong>{graph.connected_accounts}</strong>
              </div>
              <div>
                <span>Akun Mandiri (Isolates)</span>
                <strong>{graph.isolates}</strong>
              </div>
            </div>

            <div className="lc-network-layout">
              <section className="lc-panel lc-graph-panel">
                <header>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h2>Topologi Interaksi Eksplisit (Reply & Quote)</h2>
                      <p>
                        {LOCAL_API
                          ? `Menampilkan ${graph.connected_accounts} akun terhubung dan ${graph.edges.length} jalur referensi pada project aktif`
                          : 'Hanya referensi eksplisit (reply/quote) dalam sampel yang membentuk garis koneksi'}
                      </p>
                    </div>
                    {selectedNode && (
                      <UiBadge variant="topic">
                        Filter Akun: @{selectedNode.label.replace(/\.bsky\.social$/, '')}
                        <button
                          type="button"
                          onClick={() => setSelectedNodeId(null)}
                          style={{
                            border: 0,
                            background: 'transparent',
                            color: 'inherit',
                            cursor: 'pointer',
                            marginLeft: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          aria-label="Reset filter akun"
                        >
                          <X size={13} />
                        </button>
                      </UiBadge>
                    )}
                  </div>
                </header>

                <ReferenceGraph
                  graph={graph}
                  selectEdge={setSelectedEdgeId}
                  selectedEdgeId={selectedEdgeId}
                  selectedNodeId={selectedNodeId}
                  selectNode={setSelectedNodeId}
                  onAddData={() => setShowAddData(true)}
                />

                <footer style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: '0.78rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 99, background: '#2457e7', display: 'inline-block' }} />
                      Hub Utama (≥5 rujukan)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 99, background: '#7c3aed', display: 'inline-block' }} />
                      Akun Jembatan (2–4 rujukan)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 99, background: '#008e78', display: 'inline-block' }} />
                      Partisipan & Pengutip
                    </span>
                  </div>
                  <span>Klik simpul akun atau garis panah untuk menginspeksi bukti post</span>
                </footer>
              </section>

              <section className="lc-panel lc-reference-list">
                <div className="lc-list-tabs">
                  <button
                    aria-pressed={tab === 'connections'}
                    onClick={() => setTab('connections')}
                  >
                    Koneksi ({matches.length})
                  </button>
                  <button aria-pressed={tab === 'accounts'} onClick={() => setTab('accounts')}>
                    Akun ({graph.nodes.length})
                  </button>
                </div>

                <label className="lc-search">
                  <Search size={15} />
                  <input
                    aria-label="Cari akun atau koneksi"
                    placeholder="Cari handle akun atau DID..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </label>

                <div className="lc-reference-scroll">
                  {tab === 'connections' ? (
                    matches.length ? (
                      matches.map(e => {
                        const srcLabel =
                          graph.nodes.find(n => n.id === e.source)?.label.replace(/\.bsky\.social$/, '') ||
                          e.source;
                        const dstLabel =
                          graph.nodes.find(n => n.id === e.target)?.label.replace(/\.bsky\.social$/, '') ||
                          e.target;
                        return (
                          <button
                            key={e.id}
                            className={`lc-edge-row ${selectedEdgeId === e.id ? 'is-selected' : ''}`}
                            onClick={() => setSelectedEdgeId(selectedEdgeId === e.id ? null : e.id)}
                          >
                            <span>
                              @{srcLabel} <ArrowRight size={13} /> @{dstLabel}
                            </span>
                            <strong>{e.weight} rujukan</strong>
                          </button>
                        );
                      })
                    ) : (
                      <p className="lc-empty">
                        {query || selectedNodeId
                          ? 'Tidak ada koneksi yang cocok dengan filter ini.'
                          : 'Belum ada pasangan koneksi terverifikasi.'}
                      </p>
                    )
                  ) : (
                    graph.nodes
                      .filter(n =>
                        (n.label + ' ' + n.id).toLowerCase().includes(query.toLowerCase())
                      )
                      .sort((a, b) => b.references - a.references || b.posts - a.posts)
                      .map(n => (
                        <div
                          key={n.id}
                          className="lc-account-row"
                          style={{
                            cursor: 'pointer',
                            background: selectedNodeId === n.id ? '#eef4ff' : undefined,
                          }}
                          onClick={() => {
                            setSelectedNodeId(selectedNodeId === n.id ? null : n.id);
                            setTab('connections');
                          }}
                        >
                          <strong>@{n.label.replace(/\.bsky\.social$/, '')}</strong>
                          <span>
                            {n.posts} post · {n.references} rujukan masuk
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </section>
            </div>

            {edge && <EdgeEvidence edge={edge} close={() => setSelectedEdgeId(null)} />}

            <details className="lc-details">
              <summary>Cara membaca jaringan interaksi ini</summary>
              <div className="lc-help">
                <p>{graph.method}</p>
                <p>
                  Ukuran simpul (node) merepresentasikan jumlah rujukan masuk dan aktivitas post di dalam project ini. Warna membedakan Hub Utama (biru), Akun Jembatan (ungu), dan Partisipan (hijau teal) berdasarkan struktur kutipan/balasan eksplisit—bukan vonis bot atau klaim niat pelaku.
                </p>
              </div>
            </details>
          </>
        ) : (
          <p role="status" className="lc-empty">
            {error ? 'Data jaringan tidak tersedia.' : 'Memuat jaringan interaksi project…'}
          </p>
        )}
      </main>
    </div>
  );
}

function EdgeEvidence({ edge, close }: { edge: CollectionEdge; close: () => void }) {
  return (
    <section className="lc-panel lc-edge-evidence">
      <header>
        <h2>Catatan Bukti Interaksi · {edge.weight} Referensi Eksplisit</h2>
        <UiButton variant="secondary" size="sm" onClick={close}>
          Tutup Bukti
        </UiButton>
      </header>
      {edge.evidence.map((e, i) => (
        <article key={i}>
          <div>
            <strong>Post yang Dirujuk (@{e.parent.handle})</strong>
            <p>{e.parent.text}</p>
            <small>{e.parent.uri}</small>
            {e.parent.url && (
              <a href={e.parent.url} target="_blank" rel="noreferrer">
                Buka post sumber <ExternalLink size={13} />
              </a>
            )}
          </div>
          <ArrowRight size={20} />
          <div>
            <strong>
              {e.kind === 'reply' ? 'Balasan (Reply)' : 'Kutipan (Quote)'} oleh @{e.post.handle}
            </strong>
            <p>{e.post.text}</p>
            <small>{e.post.uri}</small>
            {e.post.url && (
              <a href={e.post.url} target="_blank" rel="noreferrer">
                Buka post publik <ExternalLink size={13} />
              </a>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

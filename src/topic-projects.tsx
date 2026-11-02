import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Eye,
  FolderKanban,
  Network,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { api } from './demo';
import type { ProjectsResponse, TopicProject } from './types';
import { ToolHeading } from './investigation/lab-ui';
import { UiAlertPill, UiBadge, UiButton, UiModal, UiSelect } from './ui-primitives';

const TOPIC_OPTIONS = [
  { value: 'Banjir & Drainase', label: 'Banjir & Drainase' },
  { value: 'Transportasi & Kemacetan', label: 'Transportasi & Kemacetan' },
  { value: 'Kualitas Udara & Polusi', label: 'Kualitas Udara & Polusi' },
  { value: 'Layanan Publik & Air Bersih', label: 'Layanan Publik & Air Bersih' },
];

/**
 * ActiveProjectBanner dikosongkan (return null) agar tidak terjadi duplikasi/redundansi
 * dengan kartu Project Aktif yang sudah selalu tampil di Sidebar kiri (termasuk saat di-hover ketika sidebar terlipat).
 */
export function ActiveProjectBanner(_props?: { onNavigateProjects?: () => void }) {
  return null;
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return 'Belum ada data';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function useActiveProject() {
  const [projectsData, setProjectsData] = useState<ProjectsResponse | null>(null);
  const reload = () => {
    api<ProjectsResponse>('projects')
      .then(setProjectsData)
      .catch(() => {});
  };
  useEffect(() => {
    reload();
    window.addEventListener('telisik-project-change', reload);
    return () => window.removeEventListener('telisik-project-change', reload);
  }, []);
  const activeProject =
    projectsData?.items.find(p => p.id === projectsData.active_project_id) || null;
  return { projectsData, activeProject, reload };
}

export function CreateProjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (res: ProjectsResponse) => void;
}) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('Banjir & Drainase');
  const [description, setDescription] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(['banjir', 'jakarta']);
  const [creating, setCreating] = useState(false);

  const addKeywordTag = () => {
    const parts = keywordInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    if (!parts.length) return;
    setKeywords(prev => Array.from(new Set([...prev, ...parts])));
    setKeywordInput('');
  };

  const removeKeywordTag = (kw: string) => {
    setKeywords(prev => prev.filter(item => item !== kw));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalKeywords = keywordInput.trim()
      ? Array.from(
          new Set([
            ...keywords,
            ...keywordInput
              .split(',')
              .map(s => s.trim().toLowerCase())
              .filter(Boolean),
          ]),
        )
      : keywords;
    if (!name.trim() || !finalKeywords.length) return;
    setCreating(true);
    try {
      const res = await api<ProjectsResponse & { created: TopicProject }>('projects', 'POST', {
        name: name.trim(),
        topic,
        description:
          description.trim() ||
          `Pemantauan otomatis berbasis daftar keyword: ${finalKeywords.join(', ')}.`,
        keywords: finalKeywords,
      });
      setName('');
      setDescription('');
      setKeywordInput('');
      setKeywords(['jakarta', 'warga']);
      onCreated?.(res);
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <UiModal
      open={open}
      onClose={onClose}
      eyebrow="BUAT PROJECT PEMANTAUAN BARU"
      title="Tracking Topik Berdasarkan Keyword"
      description="Masukkan nama project dan daftar kata kunci. Sistem otomatis mengumpulkan post yang cocok dan memetakan kondisinya."
    >
      <form className="tp-create-form" onSubmit={handleCreateProject}>
        <div className="tp-form-grid">
          <label className="tp-field">
            <span>Nama Project Pemantauan</span>
            <input
              type="text"
              required
              placeholder="Contoh: Krisis Sampah & TPA Regional"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <UiSelect
            label="Kategori Isu / Topik Utama"
            variant="light"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          >
            {TOPIC_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </UiSelect>
        </div>

        <label className="tp-field">
          <span>Deskripsi Singkat Fokus Pemantauan (Opsional)</span>
          <input
            type="text"
            placeholder="Contoh: Memantau keluhan warga dan potensi amplifikasi terkoordinasi"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>

        <div className="tp-field">
          <span>Daftar Keyword Pantauan (Ketik lalu tekan Enter atau klik Tambah)</span>
          <div className="tp-kw-input-row">
            <input
              type="text"
              placeholder="Ketik kata kunci, pisahkan dengan koma (misal: macet, transjakarta, halte)..."
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeywordTag();
                }
              }}
            />
            <UiButton variant="ghost" size="sm" onClick={addKeywordTag}>
              + Tambah Keyword
            </UiButton>
          </div>
          <div className="tp-kw-tags">
            {keywords.map(kw => (
              <span key={kw} className="tp-kw-tag">
                #{kw}
                <button
                  type="button"
                  onClick={() => removeKeywordTag(kw)}
                  aria-label={`Hapus keyword ${kw}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="tp-kw-presets">
            <small>Paket Keyword Cepat:</small>
            <UiButton
              variant="ghost"
              size="xs"
              onClick={() =>
                setKeywords(['banjir', 'genangan', 'drainase', 'pintu air', 'kali', 'pompa'])
              }
            >
              Paket Banjir
            </UiButton>
            <UiButton
              variant="ghost"
              size="xs"
              onClick={() =>
                setKeywords(['macet', 'transjakarta', 'mrt', 'lrt', 'krl', 'angkutan', 'tarif'])
              }
            >
              Paket Transportasi
            </UiButton>
            <UiButton
              variant="ghost"
              size="xs"
              onClick={() =>
                setKeywords(['polusi', 'udara', 'ispu', 'pm2.5', 'asap', 'emisi', 'kabut'])
              }
            >
              Paket Polusi Udara
            </UiButton>
            <UiButton
              variant="ghost"
              size="xs"
              onClick={() =>
                setKeywords(['air bersih', 'pam', 'pipa', 'mati air', 'sampah', 'layanan'])
              }
            >
              Paket Air & Layanan
            </UiButton>
          </div>
        </div>

        <div className="tp-create-footer">
          <UiButton variant="ghost" size="md" onClick={onClose}>
            Batal
          </UiButton>
          <UiButton type="submit" variant="primary" size="md" disabled={creating}>
            <Plus size={15} />
            {creating ? 'Menyiapkan Project...' : 'Simpan & Buka Project'}
          </UiButton>
        </div>
      </form>
    </UiModal>
  );
}

export function AddDataModal({
  open,
  project,
  onClose,
  onUpdated,
}: {
  open: boolean;
  project: TopicProject | null;
  onClose: () => void;
  onUpdated?: (res: ProjectsResponse) => void;
}) {
  const [mode, setMode] = useState<'sync' | 'manual' | 'live'>('sync');
  const [newKw, setNewKw] = useState('');
  const [manualHandle, setManualHandle] = useState('warga-pantau.bsky.social');
  const [manualText, setManualText] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFeedback(null);
      setNewKw('');
      setManualText('');
      setManualUrl('');
    }
  }, [open]);

  if (!open || !project) return null;

  const handleSyncKeywords = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const kws = newKw
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      const res = await api<ProjectsResponse & { sync?: { added_posts?: number } }>(
        `projects/${project.id}/sync`,
        'POST',
        { add_keywords: kws },
      );
      setNewKw('');
      setFeedback(
        `Berhasil menyinkronkan data untuk ${project.name}${
          kws.length ? ` (+${kws.length} keyword baru)` : ''
        }.`,
      );
      onUpdated?.(res);
    } finally {
      setBusy(false);
    }
  };

  const handleAddManualPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await api<ProjectsResponse>(`projects/${project.id}/sync`, 'POST', {
        manual_handle: manualHandle.trim() || 'laporan-warga.bsky.social',
        manual_text: manualText.trim(),
        manual_url: manualUrl.trim(),
      });
      setManualText('');
      setManualUrl('');
      setFeedback('1 post bukti baru berhasil ditambahkan ke project ini.');
      onUpdated?.(res);
    } finally {
      setBusy(false);
    }
  };

  const handleLiveStreamPull = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await api('stream/live', 'POST', {
        duration_seconds: 6,
        max_posts: 15,
        Indonesian_only: true,
      }).catch(() => {});
      const res = await api<ProjectsResponse>(`projects/${project.id}/sync`, 'POST', {});
      setFeedback('Berhasil menarik sampel post terbaru dan memperbarui metrik project.');
      onUpdated?.(res);
    } finally {
      setBusy(false);
    }
  };

  return (
    <UiModal
      open={open}
      onClose={onClose}
      eyebrow={`TAMBAH DATA · ${project.code}`}
      title={`Tambah Data ke "${project.name}"`}
      description="Pilih metode penambahan data bukti ke dalam project topik ini."
    >
      <div className="tp-popup-tabs" role="tablist">
        <button
          type="button"
          className={`tp-popup-tab ${mode === 'sync' ? 'is-active' : ''}`}
          onClick={() => {
            setMode('sync');
            setFeedback(null);
          }}
        >
          1. Tarik Data via Keyword
        </button>
        <button
          type="button"
          className={`tp-popup-tab ${mode === 'manual' ? 'is-active' : ''}`}
          onClick={() => {
            setMode('manual');
            setFeedback(null);
          }}
        >
          2. Input Post Manual
        </button>
        <button
          type="button"
          className={`tp-popup-tab ${mode === 'live' ? 'is-active' : ''}`}
          onClick={() => {
            setMode('live');
            setFeedback(null);
          }}
        >
          3. Live Stream Bluesky
        </button>
      </div>

      {mode === 'sync' && (
        <form className="tp-create-form" onSubmit={handleSyncKeywords}>
          <div className="tp-field">
            <span>Keyword Aktif Saat Ini ({project.keywords.length} keyword)</span>
            <div className="tp-kw-tags">
              {project.keywords.map(kw => (
                <span key={kw} className="tp-kw-tag">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
          <label className="tp-field">
            <span>Tambah Keyword Baru (Opsional, pisahkan dengan koma)</span>
            <input
              type="text"
              placeholder="Contoh: tanggul jebol, banjir rob, pompa rusak"
              value={newKw}
              onChange={e => setNewKw(e.target.value)}
            />
          </label>
          {feedback && <div className="tp-sync-toast">{feedback}</div>}
          <div className="tp-create-footer">
            <UiButton variant="ghost" size="md" onClick={onClose}>
              Tutup
            </UiButton>
            <UiButton type="submit" variant="primary" size="md" disabled={busy}>
              <RefreshCw size={14} className={busy ? 'tp-spin' : ''} />
              {busy ? 'Menarik Data...' : 'Tarik & Analisis Data Sekarang'}
            </UiButton>
          </div>
        </form>
      )}

      {mode === 'manual' && (
        <form className="tp-create-form" onSubmit={handleAddManualPost}>
          <div className="tp-form-grid">
            <label className="tp-field">
              <span>Handle / Akun Sumber</span>
              <input
                type="text"
                required
                placeholder="Contoh: warga-jaksel.bsky.social"
                value={manualHandle}
                onChange={e => setManualHandle(e.target.value)}
              />
            </label>
            <label className="tp-field">
              <span>Tautan / URL Bukti (Opsional)</span>
              <input
                type="text"
                placeholder="https://..."
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
              />
            </label>
          </div>
          <label className="tp-field">
            <span>Isi Teks Post / Klaim yang Ditemukan</span>
            <input
              type="text"
              required
              placeholder={`Masukkan teks post terkait ${project.keywords[0] || project.topic}...`}
              value={manualText}
              onChange={e => setManualText(e.target.value)}
            />
          </label>
          {feedback && <div className="tp-sync-toast">{feedback}</div>}
          <div className="tp-create-footer">
            <UiButton variant="ghost" size="md" onClick={onClose}>
              Tutup
            </UiButton>
            <UiButton type="submit" variant="primary" size="md" disabled={busy}>
              <Plus size={14} />
              {busy ? 'Menyimpan...' : 'Tambahkan Post ke Project'}
            </UiButton>
          </div>
        </form>
      )}

      {mode === 'live' && (
        <div className="tp-create-form">
          <div className="tp-popup-info-box">
            <strong>Koleksi Real-Time Bluesky Firehose</strong>
            <span>
              Sistem akan membuka koneksi ke stream publik Bluesky selama beberapa detik dan
              menyaring post berbahasa Indonesia yang cocok dengan keyword{' '}
              <b>{project.keywords.join(', ')}</b>.
            </span>
          </div>
          {feedback && <div className="tp-sync-toast">{feedback}</div>}
          <div className="tp-create-footer">
            <UiButton variant="ghost" size="md" onClick={onClose}>
              Tutup
            </UiButton>
            <UiButton variant="primary" size="md" disabled={busy} onClick={handleLiveStreamPull}>
              <RefreshCw size={14} className={busy ? 'tp-spin' : ''} />
              {busy ? 'Menangkap Stream...' : 'Mulai Tangkap Live Stream'}
            </UiButton>
          </div>
        </div>
      )}
    </UiModal>
  );
}

export function ProjectDetailModal({
  project,
  onClose,
}: {
  project: TopicProject | null;
  onClose: () => void;
}) {
  if (!project) return null;
  return (
    <UiModal
      open={!!project}
      onClose={onClose}
      eyebrow={`DETAIL KONDISI · ${project.code}`}
      title={project.name}
      description={project.description}
      size="lg"
      footer={
        <>
          <UiButton variant="ghost" size="md" onClick={onClose}>
            Tutup
          </UiButton>
          <UiButton variant="primary" size="md" href="#/collected" onClick={onClose}>
            <Network size={14} /> Buka Graf Jaringan
          </UiButton>
        </>
      }
    >
      <div className="tp-condition-columns">
        <div className="tp-subpanel">
          <header>
            <h4>Distribusi Keyword Terdeteksi</h4>
            <span>Jumlah post yang cocok untuk setiap kata kunci</span>
          </header>
          <div className="tp-kw-bars">
            {project.keyword_hits.map(item => {
              const maxCount = Math.max(
                1,
                ...project.keyword_hits.map(k => k.count),
              );
              const pct = Math.min(100, Math.round((item.count / maxCount) * 100));
              return (
                <div key={item.keyword} className="tp-kw-bar-row">
                  <div className="tp-kw-bar-label">
                    <strong>#{item.keyword}</strong>
                    <span>{item.count} post</span>
                  </div>
                  <div className="tp-kw-bar-track">
                    <div className="tp-kw-bar-fill" style={{ width: `${Math.max(8, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {project.top_clusters.length > 0 && (
            <div className="tp-mini-clusters">
              <h5>Sinyal Koordinasi Terdeteksi</h5>
              {project.top_clusters.map((c, idx) => (
                <div key={idx} className="tp-mini-cluster-item">
                  <div>
                    <strong>{c.label}</strong>
                    <p>{c.authors} akun · {c.posts} post dalam {c.span_seconds} dtk</p>
                  </div>
                  <span className="tp-rule-tag">{c.rule}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tp-subpanel">
          <header>
            <h4>Sampel Post Bukti Terbaru</h4>
            <span>Post publik yang tertangkap oleh filter keyword project</span>
          </header>
          <div className="tp-recent-posts">
            {project.recent_posts.slice(0, 4).map(post => (
              <article key={post.uri} className="tp-recent-post-item">
                <div className="tp-recent-meta">
                  <strong>@{post.handle}</strong>
                  <span>{post.created_at.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <p>{post.text}</p>
                <div className="tp-recent-tags">
                  {(post.matched_keywords || []).map(kw => (
                    <span key={kw}>#{kw}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </UiModal>
  );
}

export function TopicProjectsHub() {
  const [data, setData] = useState<ProjectsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [addDataTarget, setAddDataTarget] = useState<TopicProject | null>(null);
  const [detailTarget, setDetailTarget] = useState<TopicProject | null>(null);

  const loadProjects = () => {
    api<ProjectsResponse>('projects')
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
    window.addEventListener('telisik-project-change', loadProjects);
    return () => window.removeEventListener('telisik-project-change', loadProjects);
  }, []);

  const handleSelectProject = async (projectId: string | null) => {
    const res = await api<ProjectsResponse>('projects/active', 'PUT', { project_id: projectId });
    setData(res);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!window.confirm(`Hapus project "${projectName}"?`)) return;
    const res = await api<ProjectsResponse>(`projects/${projectId}`, 'DELETE');
    setData(res);
  };

  if (loading && !data) {
    return (
      <div className="tp-loading">
        <RefreshCw className="tp-spin" size={18} /> Memuat daftar project pemantauan...
      </div>
    );
  }

  const projects = data?.items || [];
  const activeId = data?.active_project_id;
  const activeProject = projects.find(p => p.id === activeId) || null;

  return (
    <div className="tp-hub">
      <section className="tp-projects-list-section">
        <div className="tp-list-header">
          <div>
            <h3>Daftar Project Topik ({projects.length})</h3>
            <p>
              Klik <b>Pilih Project</b> untuk mengganti fokus investigasi, atau gunakan tombol{' '}
              <b>+ Data</b> dan <b>Detail</b> untuk membuka popup.
            </p>
          </div>
          <div className="tp-header-actions">
            {activeProject && (
              <UiButton
                variant="secondary"
                size="md"
                onClick={() => setAddDataTarget(activeProject)}
              >
                <Database size={15} /> Tambah Data ({activeProject.code})
              </UiButton>
            )}
            <UiButton variant="primary" size="md" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Buat Project Baru
            </UiButton>
          </div>
        </div>

        <div className="tp-projects-grid">
          {projects.map(proj => {
            const isSelected = proj.id === activeId;
            return (
              <article
                key={proj.id}
                className={`tp-project-card ${isSelected ? 'is-active' : ''}`}
              >
                <div className="tp-card-top">
                  <div className="tp-card-badges">
                    <UiBadge variant="code">{proj.code}</UiBadge>
                    <UiBadge variant="topic">{proj.topic}</UiBadge>
                    {isSelected && <UiBadge variant="active">AKTIF</UiBadge>}
                  </div>
                  <UiAlertPill level={proj.metrics.alert_level} />
                </div>

                <h4>{proj.name}</h4>
                <p className="tp-card-desc">{proj.description}</p>

                <div className="tp-card-keywords">
                  {proj.keywords.map(kw => (
                    <span key={kw}>#{kw}</span>
                  ))}
                </div>

                <div className="tp-card-metrics">
                  <div>
                    <strong>{proj.metrics.total_posts}</strong>
                    <span>Post</span>
                  </div>
                  <div>
                    <strong>{proj.metrics.unique_authors}</strong>
                    <span>Akun</span>
                  </div>
                  <div>
                    <strong>{proj.metrics.coordination_clusters}</strong>
                    <span>Klaster</span>
                  </div>
                  <div>
                    <strong>{proj.metrics.flagged_posts}</strong>
                    <span>Anomali</span>
                  </div>
                </div>

                <div className="tp-card-footer">
                  <UiButton
                    variant={isSelected ? 'selected' : 'primary'}
                    size="md"
                    onClick={() => handleSelectProject(proj.id)}
                  >
                    <CheckCircle2 size={14} />
                    {isSelected ? 'Sedang Dipantau' : 'Pilih Project Ini'}
                  </UiButton>
                  <div className="tp-card-action-group">
                    <UiButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setAddDataTarget(proj)}
                      title="Tambah data ke project ini"
                    >
                      <Plus size={13} /> Data
                    </UiButton>
                    <UiButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailTarget(proj)}
                      title="Lihat rincian keyword & sampel post"
                    >
                      <Eye size={13} /> Detail
                    </UiButton>
                    {projects.length > 1 && (
                      <UiButton
                        variant="danger"
                        size="sm"
                        aria-label={`Hapus ${proj.name}`}
                        title="Hapus project"
                        onClick={() => handleDeleteProject(proj.id, proj.name)}
                      >
                        <Trash2 size={14} />
                      </UiButton>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          <button
            type="button"
            className="tp-project-card tp-add-project-card"
            onClick={() => setShowCreate(true)}
          >
            <div className="tp-add-card-icon">
              <Plus size={24} />
            </div>
            <strong>Buat Project Topik Baru</strong>
            <p>
              Tambahkan topik pantauan baru beserta daftar keyword untuk mulai melacak post dan
              sinyal koordinasinya.
            </p>
          </button>
        </div>
      </section>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={res => setData(res)}
      />
      <AddDataModal
        open={!!addDataTarget}
        project={addDataTarget}
        onClose={() => setAddDataTarget(null)}
        onUpdated={res => {
          setData(res);
          if (addDataTarget) {
            const updated = res.items.find(p => p.id === addDataTarget.id) || null;
            setAddDataTarget(updated);
          }
        }}
      />
      <ProjectDetailModal project={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  );
}

export function TopicProjectsPage() {
  return (
    <div className="investigation lf-shell">
      <main className="lf-main">
        <ToolHeading
          eyebrow="TOPIC PROJECTS · KEYWORD-DRIVEN MONITORING"
          title="Project Pemantauan Topik."
          accent="Satu project untuk setiap isu yang Anda pantau."
          description="Pilih project untuk memfokuskan seluruh modul analisis, atau gunakan tombol popup (+ Data / + Buat Project Baru) tanpa memenuhi layar."
          icon={FolderKanban}
        />
        <TopicProjectsHub />
      </main>
    </div>
  );
}

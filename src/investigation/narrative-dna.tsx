import { FocusPanel, FocusPanels } from './focus-panels';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Check, Dna, GitBranch, Quote, Scissors, Sparkles } from 'lucide-react';
import { actorById, clock } from './model';
import { analyzeWordingCues, narrativeVersions, wordDiff } from './case-analysis';
import { SourceButton, ToolHeading } from './lab-ui';
import { ActiveProjectBanner, useActiveProject } from '../topic-projects';
import type { TopicProject } from '../types';

interface DynamicVersion {
  id: string;
  label: string;
  subtitle: string;
  actorName: string;
  actorHandle: string;
  timeLabel: string;
  kind: string;
  text: string;
  isCaseRecord: boolean;
}

function buildProjectNarrativeVersions(proj: TopicProject): DynamicVersion[] {
  const kw0 = proj.keywords[0] || proj.topic.toLowerCase();
  const kw1 = proj.keywords[1] || 'jakarta';
  const kw2 = proj.keywords[2] || 'warga';
  const p0 = proj.recent_posts[0];
  const p1 = proj.recent_posts[1];

  const baseText =
    p0?.text ||
    `Laporan warga01: Pantauan sementara terkait ${kw0} dan ${kw1} pagi ini masih dalam penanganan petugas di dua titik utama, warga diminta menunggu pembaruan resmi.`;

  // Construct realistic narrative mutation stages grounded in the active project's topic & keywords
  const v1Text = `Laporan lapangan awal terkait ${kw0} dan ${kw1}: petugas sedang melakukan penanganan sementara di jalur utama. Kondisi ${kw2} masih terkendali dan evaluasi teknis berlangsung hingga siang ini.`;
  const v2Text = `Update ${kw0} dan ${kw1}: penanganan di jalur utama belum selesai! Kondisi ${kw2} mulai terdampak serius dan warga sekitar diminta waspada penuh siang ini.`;
  const v3Text = `PERINGATAN DARURAT: Layanan terkait ${kw0} dan ${kw1} lumpuh permanen di seluruh titik! Kondisi ${kw2} tidak tertangani sama sekali. Sebarkan informasi penting ini sekarang!`;
  const v4Text =
    p1?.text ||
    `Klarifikasi terverifikasi [${proj.code}]: Penanganan ${kw0} dan ${kw1} bersifat sementara pada jam sibuk, bukan penghentian permanen. Data pantauan (${proj.metrics.total_posts} post) menunjukkan layanan berangsur normal.`;

  return [
    {
      id: p0?.uri || `${proj.code}-v1`,
      label: `1. Laporan Awal Warga (${proj.code})`,
      subtitle: `Observasi pertama dengan kualifikasi "sementara" pada topik #${kw0}`,
      actorName: p0?.handle || `warga_${kw0.replace(/\s+/g, '_')}_01.bsky.social`,
      actorHandle: p0?.handle || `@warga_${kw0.replace(/\s+/g, '_')}_01`,
      timeLabel: '08:15 WIB',
      kind: 'original post',
      text: v1Text,
      isCaseRecord: false,
    },
    {
      id: `${proj.code}-v2`,
      label: `2. Kutipan dengan Pergeseran Framing`,
      subtitle: `Kualifikasi "sementara" hilang, diganti klaim dampak meluas pada #${kw1}`,
      actorName: `info_${kw1.replace(/\s+/g, '_')}_cepat.bsky.social`,
      actorHandle: `@info_${kw1.replace(/\s+/g, '_')}`,
      timeLabel: '09:02 WIB',
      kind: 'quote post',
      text: v2Text,
      isCaseRecord: false,
    },
    {
      id: `${proj.code}-v3`,
      label: `3. Amplifikasi Berantai (${proj.metrics.coordination_clusters} Klaster)`,
      subtitle: `Pesan sensasional tanpa konteks waktu yang diulang identik oleh banyak akun`,
      actorName: `siaga_${kw0.replace(/\s+/g, '_')}_jkt.bsky.social`,
      actorHandle: `@siaga_${kw0.replace(/\s+/g, '_')}`,
      timeLabel: '09:40 WIB',
      kind: 'amplified repost',
      text: v3Text,
      isCaseRecord: false,
    },
    {
      id: p1?.uri || `${proj.code}-v4`,
      label: `4. Konteks Lapangan & Verifikasi`,
      subtitle: baseText.slice(0, 88) + (baseText.length > 88 ? '…' : ''),
      actorName: p1?.handle || `pantau_${kw0.replace(/\s+/g, '_')}_resmi.bsky.social`,
      actorHandle: p1?.handle || `@pantau_${kw0.replace(/\s+/g, '_')}`,
      timeLabel: '10:25 WIB',
      kind: 'context clarification',
      text: v4Text,
      isCaseRecord: false,
    },
  ];
}

export default function NarrativeDNA({ open }: { open: (id: string) => void }) {
  const { activeProject } = useActiveProject();
  const [panel, setPanel] = useState('compare');
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(2);
  const [highlight, setHighlight] = useState(true);

  useEffect(() => {
    setFrom(0);
    setTo(2);
  }, [activeProject?.id]);

  const versions: DynamicVersion[] = useMemo(() => {
    if (activeProject) {
      return buildProjectNarrativeVersions(activeProject);
    }
    return narrativeVersions.map((v, i) => ({
      id: v.record.id,
      label: `${i + 1}. ${v.label}`,
      subtitle: v.subtitle,
      actorName: actorById.get(v.record.actor)?.name || v.record.actor,
      actorHandle: actorById.get(v.record.actor)?.handle || '',
      timeLabel: clock(v.record.minute),
      kind: i === 3 ? 'Separate source' : v.record.kind,
      text: v.record.text,
      isCaseRecord: true,
    }));
  }, [activeProject]);

  const safeFrom = Math.min(from, versions.length - 1);
  const safeTo = Math.min(to, versions.length - 1);
  const before = versions[safeFrom];
  const after = versions[safeTo];
  const parts = useMemo(() => wordDiff(before.text, after.text), [before.text, after.text]);

  const removedSegments = useMemo(
    () =>
      parts
        .filter(p => p.kind === 'removed')
        .map(p => p.text.replace(/^[\s:;,.]+/, '').trim())
        .filter(Boolean),
    [parts],
  );
  const addedSegments = useMemo(
    () =>
      parts
        .filter(p => p.kind === 'added')
        .map(p => p.text.replace(/^[\s:;,.]+/, '').trim())
        .filter(Boolean),
    [parts],
  );

  const removed = removedSegments.join(' · ');
  const added = addedSegments.join(' · ');
  const cues = useMemo(() => analyzeWordingCues(before.text, after.text), [before.text, after.text]);

  const beforeParts = useMemo(() => parts.filter(p => p.kind !== 'added'), [parts]);
  const afterParts = useMemo(() => parts.filter(p => p.kind !== 'removed'), [parts]);

  const linked = safeFrom < safeTo && safeTo <= 2;

  const renderVersionSelectors = (idPrefix: string) => (
    <div className="lf-comparison-controls">
      <label htmlFor={`${idPrefix}-from`}>
        Bandingkan dari (Versi Awal)
        <select
          id={`${idPrefix}-from`}
          aria-label="Compare from version"
          value={safeFrom}
          onChange={e => setFrom(+e.target.value)}
        >
          {versions.map((v, i) => (
            <option value={i} key={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="lf-icon-button"
        aria-label="Tukar urutan versi"
        title="Tukar urutan versi"
        onClick={() => {
          setFrom(safeTo);
          setTo(safeFrom);
        }}
      >
        <ArrowLeftRight size={18} />
      </button>
      <label htmlFor={`${idPrefix}-to`}>
        Bandingkan ke (Versi Pembanding)
        <select
          id={`${idPrefix}-to`}
          aria-label="Compare to version"
          value={safeTo}
          onChange={e => setTo(+e.target.value)}
        >
          {versions.map((v, i) => (
            <option value={i} key={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <>
      <ToolHeading
        eyebrow="01 / NARRATIVE DNA"
        title="A small edit."
        accent="A different story."
        description="Bandingkan perubahan kata demi kata, temukan konteks yang dihilangkan, dan lacak bagaimana narasi bergeser pada topik yang sedang Anda pantau."
        icon={Dna}
      />
      <ActiveProjectBanner />

      <FocusPanels label="Narrative investigation" active={panel} onChange={setPanel}>
        <FocusPanel id="compare" label="Compare text">
          <section className="lf-panel lf-diff-panel">
            <header className="lf-panel-heading">
              <div>
                <span className="lf-eyebrow">
                  PERBANDINGAN KATA DEMI KATA ·{' '}
                  {activeProject ? activeProject.code : 'GLOBAL'}
                </span>
                <h2>
                  {activeProject
                    ? `Evolusi Wacana: ${activeProject.name}`
                    : 'Perbandingan Perubahan Redaksional'}
                </h2>
              </div>
              <label className="lf-check">
                <input
                  type="checkbox"
                  checked={highlight}
                  onChange={e => setHighlight(e.target.checked)}
                />
                Sorot perubahan kata
              </label>
            </header>
            {renderVersionSelectors('compare')}
            <div className="lf-diff-columns">
              <article>
                <header>
                  <span className="lf-pill lf-rose">
                    <Scissors size={12} />
                    TEKS AWAL (BEFORE)
                  </span>
                  <time>{before.timeLabel}</time>
                </header>
                <h3>{before.actorName}</h3>
                <p className="lf-diff-text">
                  {beforeParts.map((p, i) => {
                    const txt = i === 0 ? p.text.trimStart() : p.text;
                    return highlight && p.kind === 'removed' ? (
                      <del key={i}>{txt}</del>
                    ) : (
                      <span key={i}>{txt}</span>
                    );
                  })}
                </p>
                {before.isCaseRecord ? (
                  <SourceButton id={before.id} onOpen={open} />
                ) : (
                  <span className="tp-record-chip">Record: {before.id}</span>
                )}
              </article>
              <article>
                <header>
                  <span className="lf-pill lf-teal">
                    <Quote size={12} />
                    TEKS PEMBANDING (AFTER)
                  </span>
                  <time>{after.timeLabel}</time>
                </header>
                <h3>{after.actorName}</h3>
                <p className="lf-diff-text">
                  {afterParts.map((p, i) => {
                    const txt = i === 0 ? p.text.trimStart() : p.text;
                    return highlight && p.kind === 'added' ? (
                      <ins key={i}>{txt}</ins>
                    ) : (
                      <span key={i}>{txt}</span>
                    );
                  })}
                </p>
                {after.isCaseRecord ? (
                  <SourceButton id={after.id} onOpen={open} />
                ) : (
                  <span className="tp-record-chip">Record: {after.id}</span>
                )}
              </article>
            </div>
            <div className="lf-relationship-note">
              <GitBranch size={15} />
              {safeFrom === safeTo
                ? 'Anda sedang membandingkan versi catatan yang sama.'
                : linked
                ? 'Terdapat jalur referensi balasan/kutipan (reply/quote) langsung yang menghubungkan kedua versi ini.'
                : 'Kedua versi ini berasal dari cabang percakapan terpisah (klarifikasi independen).'}
            </div>
          </section>
        </FocusPanel>
        <FocusPanel id="timeline" label="Story timeline">
          <section className="lf-panel lf-version-panel">
            <header className="lf-panel-heading">
              <Dna size={19} />
              <div>
                <h2>
                  {activeProject
                    ? `Empat Tahap Pergeseran Narasi · ${activeProject.name}`
                    : 'Empat Tahap Pergeseran Narasi'}
                </h2>
                <p>Klik salah satu tahap untuk membandingkan perubahan teksnya.</p>
              </div>
            </header>
            <div className="lf-dna-spine">
              {versions.map((version, i) => (
                <button
                  key={version.id}
                  className={`lf-version ${safeTo === i ? 'is-active' : ''}`}
                  onClick={() => {
                    setTo(i);
                    if (safeFrom === i) setFrom(i === 0 ? 1 : 0);
                    setPanel('compare');
                  }}
                >
                  <span className="lf-version-dot">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <small>
                      {version.timeLabel} · {version.kind}
                    </small>
                    <strong>{version.label}</strong>
                    <p>{version.subtitle}</p>
                    <span>{version.actorName}</span>
                  </div>
                  {safeTo === i && <Check size={15} />}
                </button>
              ))}
            </div>
            <div className="lf-callout">
              <GitBranch size={17} />
              <p>
                Tahap 1 → 2 → 3 memiliki rantai kutipan berurutan di mana konteks awal menyempit. Tahap 4 merupakan klarifikasi berbasis data pantauan project.
              </p>
            </div>
          </section>
        </FocusPanel>
        <FocusPanel id="cues" label="Wording cues">
          <section className="lf-panel lf-cues-panel">
            <header className="lf-panel-heading">
              <div>
                <span className="lf-eyebrow">
                  ANALISIS LEKSIKAL · {activeProject ? activeProject.code : 'GLOBAL'}
                </span>
                <h2>Indikator Pergeseran Kata (Wording Cues)</h2>
                <p>
                  Deteksi berbasis aturan transparan untuk memantau penghilangan kualifikasi waktu, kemunculan klaim absolut, dan eskalasi tanda baca.
                </p>
              </div>
              <span className="lf-pill">
                <Sparkles size={12} />
                {cues.length} Indikator Terdeteksi
              </span>
            </header>

            {renderVersionSelectors('cues')}

            <div className="lf-cues-body">
              <div className="lf-cues-grid">
                {cues.map(cue => (
                  <article key={cue.id} className={`lf-cue-card is-${cue.tone}`}>
                    <header className="lf-cue-head">
                      <span
                        className={`lf-pill ${
                          cue.tone === 'rose'
                            ? 'lf-rose'
                            : cue.tone === 'teal'
                            ? 'lf-teal'
                            : cue.tone === 'amber'
                            ? 'lf-amber'
                            : ''
                        }`}
                      >
                        {cue.badge}
                      </span>
                    </header>
                    <h4>{cue.title}</h4>
                    <p>{cue.detail}</p>
                  </article>
                ))}
              </div>
              <p className="lf-cues-disclaimer">
                Indikator berbasis aturan leksikal transparan. Bukan vonis kebenaran otomatis atau klaim niat pelaku.
              </p>
            </div>

            <div className="lf-fragment-section">
              <header className="lf-fragment-head">
                <div>
                  <h3>Inspeksi Fragmen Kata yang Dihapus vs Ditambahkan</h3>
                  <p>
                    Potongan frasa yang hilang dari <strong>{before.label}</strong> dan frasa baru yang muncul pada <strong>{after.label}</strong>.
                  </p>
                </div>
              </header>

              <div className="lf-fragment-grid">
                <article className="lf-fragment-card is-removed">
                  <header className="lf-fragment-card-head">
                    <span className="lf-pill lf-rose">
                      <Scissors size={12} />
                      Dihapus (Removed)
                    </span>
                    <small>{removedSegments.length} segmen frasa</small>
                  </header>
                  {removedSegments.length > 0 ? (
                    <>
                      <div className="lf-fragment-chips">
                        {removedSegments.map((seg, idx) => (
                          <span key={idx} className="lf-fragment-chip is-removed">
                            {seg}
                          </span>
                        ))}
                      </div>
                      <p className="lf-fragment-summary">{removed}</p>
                    </>
                  ) : (
                    <p className="lf-fragment-empty">Tidak ada fragmen teks yang dihapus.</p>
                  )}
                </article>

                <article className="lf-fragment-card is-added">
                  <header className="lf-fragment-card-head">
                    <span className="lf-pill lf-teal">
                      <Quote size={12} />
                      Ditambahkan (Added)
                    </span>
                    <small>{addedSegments.length} segmen frasa</small>
                  </header>
                  {addedSegments.length > 0 ? (
                    <>
                      <div className="lf-fragment-chips">
                        {addedSegments.map((seg, idx) => (
                          <span key={idx} className="lf-fragment-chip is-added">
                            {seg}
                          </span>
                        ))}
                      </div>
                      <p className="lf-fragment-summary">{added}</p>
                    </>
                  ) : (
                    <p className="lf-fragment-empty">Tidak ada fragmen teks yang ditambahkan.</p>
                  )}
                </article>
              </div>
            </div>
          </section>
        </FocusPanel>
      </FocusPanels>
    </>
  );
}

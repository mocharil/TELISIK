import { FocusPanel, FocusPanels } from './focus-panels';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, Clock3, Fingerprint, Link2, SlidersHorizontal, Users } from 'lucide-react';
import { actorById, clock } from './model';
import { canonicalUrl, findRepeatedShares, shareEvents } from './case-analysis';
import { SourceButton, ToolHeading } from './lab-ui';
import { useActiveProject } from '../topic-projects';
import { UiAlertPill } from '../ui-primitives';
import { api } from '../demo';
import type { Cluster } from '../types';

export default function CoordinationFingerprint({ open }: { open: (id: string) => void }) {
  const { activeProject } = useActiveProject();
  const [panel, setPanel] = useState('matrix');
  const [windowMinutes, setWindow] = useState(3);
  const [minimum, setMinimum] = useState(2);
  const [pairId, setPair] = useState<string | null>(null);
  const [allAccounts, setAllAccounts] = useState(false);
  const [cellIds, setCells] = useState<string[]>([]);
  const [projectClusters, setProjectClusters] = useState<Cluster[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');

  useEffect(() => {
    let valid = true;
    api<{ clusters: Cluster[] }>(`coordination?minimum=3&window=${windowMinutes * 60}`)
      .then(res => {
        if (valid) {
          setProjectClusters(res.clusters);
          setSelectedClusterId(res.clusters[0]?.id || '');
        }
      })
      .catch(() => {});
    return () => {
      valid = false;
    };
  }, [activeProject?.id, windowMinutes]);

  const pairs = useMemo(
    () => findRepeatedShares(shareEvents, windowMinutes, minimum),
    [windowMinutes, minimum]
  );
  const selected = pairs.find(p => p.id === pairId) || pairs[0] || null;
  const candidateActors = new Set(pairs.flatMap(p => p.actors));
  const rowIds = [...new Set(shareEvents.map(e => e.actor))].filter(
    id => allAccounts || candidateActors.has(id)
  );
  const evidence = cellIds.length
    ? shareEvents.filter(e => cellIds.includes(e.id))
    : selected?.events || [];
  const bins = Array.from({ length: 24 }, (_, i) => i * 10);
  const activeCluster =
    projectClusters.find(c => c.id === selectedClusterId) || projectClusters[0] || null;

  return (
    <>
      <ToolHeading
        eyebrow="02 / COORDINATION FINGERPRINT"
        title="Same links."
        accent="Repeated timing."
        description="Deteksi pola berbagi tautan atau pesan identik dalam rentang waktu sempit pada project aktif Anda, lengkap dengan matriks ritme penyebaran."
        icon={Fingerprint}
      >
        <span className="lf-heading-stamp">
          <Fingerprint size={28} />
          <strong>
            {activeProject
              ? activeProject.metrics.coordination_clusters
              : projectClusters.length || pairs.length}
          </strong>
          <span>klaster sinyal aktif</span>
        </span>
      </ToolHeading>

      {/* Coordination Clusters Strip */}
      {activeProject && (
        <section className="tp-coord-project-card" aria-label="Klaster Koordinasi">
          <header className="tp-coord-project-head">
            <div>
              <span className="tp-eyebrow">DETEKSI KLASTER KOORDINASI</span>
              <h3>{projectClusters.length} Pola Kandidat Terdeteksi</h3>
            </div>
            <UiAlertPill
              level={activeProject.metrics.alert_level}
              label={`${activeProject.metrics.alert_level} (${activeProject.metrics.flagged_posts} post terlibat)`}
            />
          </header>

          {projectClusters.length > 0 ? (
            <div className="tp-coord-cluster-grid">
              <div className="tp-coord-cluster-list">
                {projectClusters.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`tp-coord-cluster-btn ${
                      activeCluster?.id === c.id ? 'is-active' : ''
                    }`}
                    onClick={() => setSelectedClusterId(c.id)}
                  >
                    <span className="tp-coord-idx">0{idx + 1}</span>
                    <div>
                      <strong>{c.label}</strong>
                      <small>
                        {c.authors} akun berbeda · {c.posts} post identik dalam {c.span_seconds} detik
                      </small>
                    </div>
                    <span className="tp-rule-tag">{c.rule}</span>
                  </button>
                ))}
              </div>
              {activeCluster && (
                <div className="tp-coord-cluster-detail">
                  <div className="tp-coord-detail-top">
                    <strong>Bukti Post Serempak ({activeCluster.posts} post)</strong>
                    <span>Rentang waktu: {activeCluster.span_seconds} detik</span>
                  </div>
                  <div className="tp-coord-evidence-list">
                    {activeCluster.evidence.slice(0, 4).map(post => (
                      <article key={post.uri} className="tp-coord-evidence-item">
                        <div>
                          <b>{post.handle}</b>
                          <time>
                            {new Date(post.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </time>
                        </div>
                        <p>{post.text}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="tp-coord-empty">
              Tidak ada klaster yang melewati ambang batas saat ini pada project {activeProject.name}.
            </p>
          )}
        </section>
      )}

      <section className="lf-filter-bar">
        <span>
          <SlidersHorizontal size={17} />
          Pattern rule
        </span>
        <label>
          Maximum delay
          <select
            aria-label="Maximum sharing delay"
            value={windowMinutes}
            onChange={e => {
              setWindow(+e.target.value);
              setCells([]);
            }}
          >
            <option value="1">1 minute</option>
            <option value="3">3 minutes</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
          </select>
        </label>
        <label>
          Minimum different URLs
          <select
            aria-label="Minimum different URLs"
            value={minimum}
            onChange={e => {
              setMinimum(+e.target.value);
              setCells([]);
            }}
          >
            <option value="1">1 URL</option>
            <option value="2">2 URLs</option>
            <option value="3">3 URLs</option>
            <option value="4">4 URLs</option>
          </select>
        </label>
        <label className="lf-check">
          <input
            type="checkbox"
            checked={allAccounts}
            onChange={e => setAllAccounts(e.target.checked)}
          />
          Show all sample accounts
        </label>
      </section>
      <FocusPanels label="Coordination investigation" active={panel} onChange={setPanel}>
        <FocusPanel id="matrix" label="Timing matrix">
          <section className="lf-panel lf-matrix-panel">
            <header className="lf-panel-heading">
              <div>
                <span className="lf-eyebrow">
                  ACCOUNT × TIME · {activeProject ? activeProject.code : 'GLOBAL'}
                </span>
                <h2>The pattern has a rhythm.</h2>
                <p>
                  Each cell is a 10-minute display bin. Matching uses exact minute differences.
                </p>
              </div>
              <span className="lf-pill lf-teal">
                <Users size={13} />
                {candidateActors.size} candidate accounts
              </span>
            </header>
            <div className="lf-matrix-scroll">
              <table className="lf-matrix">
                <caption className="lf-sr-only">
                  URL-share events per account in ten-minute bins. Select a cell to inspect its records.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Account</th>
                    {bins.map((minute, i) => (
                      <th scope="col" key={minute}>
                        <span>{i % 3 === 0 ? clock(minute) : '·'}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowIds.map(id => (
                    <tr
                      key={id}
                      className={selected?.actors.includes(id) ? 'is-selected' : ''}
                    >
                      <th scope="row">
                        <span className="lf-avatar-dot" />
                        {actorById.get(id)?.name}
                      </th>
                      {bins.map(minute => {
                        const events = shareEvents.filter(
                          e => e.actor === id && e.minute >= minute && e.minute < minute + 10
                        );
                        const isMatch = events.some(e =>
                          selected?.events.some(s => s.id === e.id)
                        );
                        return (
                          <td key={minute}>
                            {events.length ? (
                              <button
                                className={isMatch ? 'is-match' : ''}
                                aria-label={`${actorById.get(id)?.name} at ${clock(minute)}, ${
                                  events.length
                                } share records`}
                                onClick={() => {
                                  setCells(events.map(e => e.id));
                                  setPanel('records');
                                }}
                              >
                                {events.length}
                              </button>
                            ) : (
                              <span />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rowIds.length === 0 && (
                <div className="lf-empty">
                  <Fingerprint size={30} />
                  <h3>No pairs meet this rule.</h3>
                  <p>Try a lower URL threshold or show all accounts to inspect the sample.</p>
                  <button
                    className="lf-button"
                    onClick={() => {
                      setMinimum(2);
                      setWindow(3);
                    }}
                  >
                    Reset pattern rule
                  </button>
                </div>
              )}
            </div>
            <footer className="lf-matrix-legend">
              <span>
                <i />
                Recorded share
              </span>
              <span>
                <i />
                Selected pair’s shared URLs
              </span>
              <span>Blank = no share in this sample bin</span>
            </footer>
          </section>
        </FocusPanel>
        <FocusPanel id="pairs" label="Candidate pairs">
          <aside className="lf-panel lf-pair-panel">
            <header className="lf-panel-heading">
              <Fingerprint size={20} />
              <div>
                <h2>Repeated co-sharing pairs</h2>
                <p>{pairs.length} meet the selected rule</p>
              </div>
            </header>
            <div className="lf-pair-list">
              {pairs.map((p, i) => (
                <button
                  key={p.id}
                  className={selected?.id === p.id ? 'is-active' : ''}
                  onClick={() => {
                    setPair(p.id);
                    setCells([]);
                    setPanel('records');
                  }}
                >
                  <span className="lf-pair-index">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{actorById.get(p.actors[0])?.name}</strong>
                    <span>+ {actorById.get(p.actors[1])?.name}</span>
                  </div>
                  <small>
                    {p.urls.length}
                    <span>URLs</span>
                  </small>
                </button>
              ))}
            </div>
            <div className="lf-callout">
              <Users size={18} />
              <p>
                A common newsletter, scheduled publisher, or shared event may explain timing. Candidate pairs require review; they are not a finding of coordinated intent.
              </p>
            </div>
          </aside>
        </FocusPanel>
        <FocusPanel id="records" label="Share records">
          <section className="lf-panel lf-share-evidence">
            <header className="lf-panel-heading">
              <div>
                <span className="lf-eyebrow">INSPECTABLE TIMING EVIDENCE</span>
                <h2>
                  {cellIds.length
                    ? 'Selected time cell'
                    : selected
                    ? 'Three links do not establish one operator.'
                    : 'No matching pair selected'}
                </h2>
              </div>
              {cellIds.length > 0 && (
                <button className="lf-text-button" onClick={() => setCells([])}>
                  Back to pair
                </button>
              )}
            </header>
            {selected && !cellIds.length && (
              <div className="lf-pair-rule">
                <Link2 size={16} />
                <strong>{selected.urls.length} distinct URLs</strong>
                <span>·</span>
                <Clock3 size={15} />
                <span>
                  {selected.minDelay}–{selected.maxDelay} minute delay
                </span>
              </div>
            )}
            <div className="lf-share-records">
              {evidence.map(e => (
                <article key={e.id}>
                  <time>{clock(e.minute)}</time>
                  <div>
                    <strong>{actorById.get(e.actor)?.name}</strong>
                    <code>{canonicalUrl(e.url).replace('https://', '')}</code>
                    <SourceButton id={e.id} onOpen={open} />
                  </div>
                  <ArrowDown size={13} />
                </article>
              ))}
            </div>
            <p className="lf-note">
              URL tracking parameters are removed for matching; content parameters are kept.
            </p>
          </section>
        </FocusPanel>
      </FocusPanels>
    </>
  );
}

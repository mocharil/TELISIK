import { BookOpenCheck } from 'lucide-react';
import { ToolHeading } from './lab-ui';
import { FocusPanel, FocusPanels } from './focus-panels';
import GroundTruth from './ground-truth';
import HypothesisArena from './hypothesis-arena';
import BlindSpots from './blind-spots';
import { fmtDate, useActiveProject } from '../topic-projects';
import { UiButton } from '../ui-primitives';

export default function EvidenceReview({
  initial = 'ground-truth',
  open,
}: {
  initial?: string;
  open: (id: string) => void;
}) {
  const { activeProject } = useActiveProject();
  return (
    <>
      <ToolHeading
        eyebrow="INVESTIGATION / REVIEW"
        title="Evidence review."
        accent="Test the story."
        description="Periksa dokumen rujukan, uji hipotesis alternatif terhadap bukti yang terkumpul, dan identifikasi celah cakupan data."
        icon={BookOpenCheck}
      />

      {activeProject && (
        <section className="tp-coord-project-card" aria-label="Sampel Bukti Lapangan untuk Verifikasi">
          <header className="tp-coord-project-head">
            <div>
              <span className="tp-eyebrow">SAMPEL BUKTI LAPANGAN</span>
              <h3>Ringkasan Post Terbaru ({activeProject.metrics.total_posts} Post)</h3>
            </div>
            <UiButton
              variant="secondary"
              size="sm"
              onClick={() => {
                window.location.hash = '#/posts';
              }}
            >
              Buka Seluruh Post ({activeProject.metrics.total_posts})
            </UiButton>
          </header>
          <div className="tp-review-evidence-strip">
            {activeProject.recent_posts.slice(0, 3).map(post => (
              <article key={post.uri} className="tp-review-evidence-card">
                <div className="tp-recent-meta">
                  <strong>{post.handle}</strong>
                  <span>{fmtDate(post.created_at)}</span>
                </div>
                <p>{post.text}</p>
                <div className="tp-recent-tags">
                  {(post.matched_keywords || activeProject.keywords.slice(0, 2)).map(k => (
                    <span key={k}>#{k}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="evidence-workbench">
        <FocusPanels label="Evidence review tools" initial={initial}>
          <FocusPanel id="ground-truth" label="Source check">
            <GroundTruth open={open} />
          </FocusPanel>
          <FocusPanel id="hypotheses" label="Hypotheses">
            <HypothesisArena open={open} />
          </FocusPanel>
          <FocusPanel id="blind-spots" label="Data gaps">
            <BlindSpots open={open} />
          </FocusPanel>
        </FocusPanels>
      </div>
    </>
  );
}

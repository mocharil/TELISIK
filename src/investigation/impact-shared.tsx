import { useState } from 'react';
import { ClipboardCheck, Target } from 'lucide-react';
import type { ImpactReview as Review } from './impact-model';
const now = () => new Date().toISOString();

export function PanelHeading({ icon: Icon, title, detail }: { icon: typeof Target; title: string; detail: string }) {
  return <header className="ir-panel-heading"><span><Icon size={19} /></span><div><h2>{title}</h2><p>{detail}</p></div></header>;
}

export function ReviewerPanel({ review, onSave }: { review: Pick<Review, 'execution' | 'signoff'>; onSave: (s: NonNullable<Review['signoff']>) => void }) {
  const [reviewer, setReviewer] = useState(review.signoff?.reviewer || ''), [decision, setDecision] = useState(review.signoff?.decision || 'Continue monitoring'), [note, setNote] = useState(review.signoff?.note || '');
  const unsaved = review.signoff && (reviewer !== review.signoff.reviewer || decision !== review.signoff.decision || note !== review.signoff.note);
  return <section className="ir-panel ir-reviewer"><PanelHeading icon={ClipboardCheck} title="What should happen next?" detail="The calculation informs a human decision. Keep reasoning and uncertainty with the result." /><form className="ir-panel-body" onSubmit={e => { e.preventDefault(); onSave({ reviewer, decision, note, recordedAt: now() }); }}><div className="ir-reviewer-fields"><label className="ir-field">Reviewer<input aria-label="Impact reviewer" maxLength={150} value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="Your name or demo initials" /></label><label className="ir-field">Next action<select aria-label="Impact next action" value={decision} onChange={e => setDecision(e.target.value)}><option>Continue monitoring</option><option>Revise the response</option><option>Collect more evidence</option></select></label></div><label className="ir-field">Reasoning and remaining uncertainty<textarea aria-label="Impact reviewer reasoning" maxLength={4000} rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Explain what the sample supports, alternative explanations and what you would check next." /></label><div className="ir-review-submit"><button className="ir-button is-primary" disabled={reviewer.trim().length < 2 || note.trim().length < 10}><ClipboardCheck size={16} />Save human review</button><span role="status">{unsaved ? 'Unsaved reviewer edits. Save to update the recorded review.' : review.signoff ? `Review recorded · ${review.signoff.decision}` : 'Review pending. Changes to evidence conditions clear sign-off.'}</span></div></form></section>;
}

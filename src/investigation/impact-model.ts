export type Cohort = 'response' | 'comparison';
export type SampleMode = 'complete' | 'missing' | 'worse';
export type CheckId = 'trends' | 'spillover' | 'collection' | 'events';
export type ImpactRecord = { id: string; cohort: Cohort; hour: number; assertion: boolean; text: string };
export type Execution = { officer: string; channel: string; proof: string; wording: string; recordedAt: string };
export type Signoff = { reviewer: string; decision: string; note: string; recordedAt: string };
export type ImpactReview = {
  version: 1; goal: string; target: number; lockedAt: string | null; execution: Execution | null;
  sampleMode: SampleMode; checks: Record<CheckId, boolean>; signoff: Signoff | null;
  history: { at: string; text: string }[];
};
export const checkDefinitions: { id: CheckId; title: string; detail: string }[] = [
  { id: 'trends', title: 'Comparable pre-action trends', detail: 'Review multiple baseline periods and the reason for choosing this comparison.' },
  { id: 'spillover', title: 'No known spillover to the comparison', detail: 'Check whether the comparison also received the clarification through another path.' },
  { id: 'collection', title: 'Consistent collection and labels', detail: 'Same source scope, collection windows, deduplication and assertion-label rules.' },
  { id: 'events', title: 'Alternative events investigated', detail: 'Check new announcements, service changes and other responses during the window.' },
];
export const recommendation = 'Publish a follow-up clarification with the temporary-closure notice, reopening schedule and a contact for questions.';
export const defaultWording = 'Halte Cendana ditutup sementara untuk perawatan. Lihat jadwal pembukaan pada pemberitahuan terlampir. Hubungi layanan informasi jika membutuhkan bantuan.';
export function initialImpact(example = true): ImpactReview {
  return { version: 1, goal: 'Reduce permanent-closure assertions in the observed Cendana sample.', target: 35,
    lockedAt: example ? 'Scenario Day 2 · 07:45 WIB' : null,
    execution: example ? { officer: 'Rani · fictional officer', channel: 'Public clarification + community notice', proof: 'ACTION-B / fictional publication receipt', wording: defaultWording, recordedAt: 'Scenario Day 2 · 12:00 WIB' } : null,
    sampleMode: 'complete', checks: { trends: example, spillover: example, collection: example, events: example }, signoff: null,
    history: example ? [{ at: 'Day 2 · 07:45', text: 'Example measurement plan locked before the action.' }, { at: 'Day 2 · 12:00', text: 'Example action B recorded as published. Fictional receipt: ACTION-B.' }] : [],
  };
}
// Supplemental evaluation fixture. These 800 records are separate from the 637 network events.
export function impactRecords(mode: SampleMode): ImpactRecord[] {
  const counts = { response: [30, 28, 32, 30, ...(mode === 'worse' ? [34, 32, 30, 34] : [20, 16, 13, 11])], comparison: [25, 23, 27, 25, 23, 21, 19, 17] };
  return (['response', 'comparison'] as Cohort[]).flatMap(cohort => counts[cohort].flatMap((count, hour) => {
    if (mode === 'missing' && cohort === 'comparison' && hour >= 4) return [];
    return Array.from({ length: 50 }, (_, i) => ({ id: `IR-${cohort === 'response' ? 'R' : 'C'}-${hour + 8}-${String(i + 1).padStart(3, '0')}`, cohort, hour: hour + 8, assertion: i < count,
      text: i < count ? 'Halte Cendana ditutup permanen, tidak akan dibuka lagi.' : hour < 4 ? 'Saya sedang mencari jadwal layanan Halte Cendana.' : 'Informasinya menyebut perawatan sementara. Saya menunggu jadwal pembukaan.' }));
  }));
}
export function summarizeImpact(records: ImpactRecord[], cohort: Cohort, after: boolean) {
  const selected = records.filter(r => r.cohort === cohort && (r.hour >= 12) === after);
  const assertions = selected.filter(r => r.assertion).length;
  return { count: selected.length, assertions, rate: selected.length ? assertions / selected.length * 100 : null };
}
export function evaluateImpact(review: ImpactReview) {
  const records = impactRecords(review.sampleMode);
  const responseBefore = summarizeImpact(records, 'response', false), responseAfter = summarizeImpact(records, 'response', true);
  const comparisonBefore = summarizeImpact(records, 'comparison', false), comparisonAfter = summarizeImpact(records, 'comparison', true);
  const complete = [responseBefore, responseAfter, comparisonBefore, comparisonAfter].every(v => v.count === 200);
  const eligible = !!review.execution && complete && checkDefinitions.every(c => review.checks[c.id]);
  const observed = review.execution && responseAfter.rate !== null && responseBefore.rate !== null ? responseAfter.rate - responseBefore.rate : null;
  const comparisonChange = comparisonAfter.rate !== null && comparisonBefore.rate !== null ? comparisonAfter.rate - comparisonBefore.rate : null;
  const adjusted = eligible && observed !== null && comparisonChange !== null ? observed - comparisonChange : null;
  const expected = eligible && comparisonChange !== null ? responseBefore.rate! + comparisonChange : null;
  return { records, responseBefore, responseAfter, comparisonBefore, comparisonAfter, complete, eligible, observed, adjusted, expected,
    targetMet: review.execution && complete ? responseAfter.rate! <= review.target : null,
    evidence: !review.execution ? 'Awaiting execution' : !complete ? 'Insufficient data' : !eligible ? 'Observed change only' : 'Comparison-supported example',
  };
}
export function validExecution(value: Execution) { return [value.officer, value.channel, value.proof, value.wording].every(s => s.trim().length >= 3); }
export function lockImpactPlan(review: ImpactReview, at: string): ImpactReview {
  if (review.lockedAt || review.goal.trim().length < 10 || !Number.isFinite(review.target) || review.target < 0 || review.target > 100) return review;
  return { ...review, lockedAt: at, history: [...review.history, { at, text: `Plan locked: target ≤${review.target}% assertions; 4-hour before/after windows.` }].slice(-50) };
}
export function recordImpactExecution(review: ImpactReview, execution: Execution): ImpactReview {
  if (!review.lockedAt || review.execution || !validExecution(execution)) return review;
  return { ...review, execution: { ...execution }, history: [...review.history, { at: execution.recordedAt, text: 'Demo execution recorded. Scenario action time: Day 2, 12:00 WIB.' }].slice(-50) };
}
export function changeImpactEvidence(review: ImpactReview, patch: Partial<Pick<ImpactReview, 'sampleMode' | 'checks'>>, at: string): ImpactReview {
  return { ...review, ...patch, signoff: null, history: [...review.history, { at, text: 'Evidence conditions changed; previous reviewer sign-off cleared.' }].slice(-50) };
}
export function signImpactReview(review: ImpactReview, signoff: Signoff): ImpactReview {
  if (!review.execution || signoff.reviewer.trim().length < 2 || signoff.note.trim().length < 10 || !['Continue monitoring', 'Revise the response', 'Collect more evidence'].includes(signoff.decision)) return review;
  return { ...review, signoff: { ...signoff }, history: [...review.history, { at: signoff.recordedAt, text: `Reviewer recorded: ${signoff.decision}.` }].slice(-50) };
}
export function parseImpact(raw: string | null, example = true): ImpactReview {
  const fallback = initialImpact(example);
  try {
    const r = JSON.parse(raw || 'null');
    const text = (v: unknown, max = 4000): v is string => typeof v === 'string' && v.length <= max;
    if (!r || r.version !== 1 || !text(r.goal) || typeof r.target !== 'number' || !Number.isFinite(r.target) || r.target < 0 || r.target > 100 || !(r.lockedAt === null || text(r.lockedAt, 100)) || !['complete', 'missing', 'worse'].includes(r.sampleMode) || !r.checks || !checkDefinitions.every(c => typeof r.checks[c.id] === 'boolean') || !Array.isArray(r.history) || r.history.length > 50 || !r.history.every((h: any) => h && text(h.at, 100) && text(h.text))) return fallback;
    if (r.execution !== null && (!r.lockedAt || !r.execution || !['officer', 'channel', 'proof', 'wording', 'recordedAt'].every(k => text(r.execution[k])) || !validExecution(r.execution))) return fallback;
    if (r.signoff !== null && (!r.execution || !r.signoff || !['reviewer', 'decision', 'note', 'recordedAt'].every(k => text(r.signoff[k])) || !['Continue monitoring', 'Revise the response', 'Collect more evidence'].includes(r.signoff.decision) || r.signoff.reviewer.trim().length < 2 || r.signoff.note.trim().length < 10)) return fallback;
    return r as ImpactReview;
  } catch { return fallback; }
}
export function impactReport(review: ImpactReview) {
  const r = evaluateImpact(review), percent = (n: number | null) => n === null ? 'Unavailable' : `${n.toFixed(1)}%`;
  return `# TELISIK Impact Review\n\nFICTIONAL DEMO. Supplemental sample; no live collection or AI. Local editable record, not an authenticated audit log.\n\n## Case A / Action B\n${recommendation}\n\n## Locked measurement plan\nGoal: ${review.goal}\nTarget: ≤${review.target}% permanent-closure assertions among sampled posts.\nPlan locked: ${review.lockedAt || 'Not locked'}\nScenario windows: Day 2, 08:00–12:00 vs 12:00–16:00 WIB.\nSeparate fictional response and comparison samples, 200 posts per group per window.\n\n## Actual execution\n${review.execution ? JSON.stringify(review.execution, null, 2) : 'Not recorded; no post-action conclusion.'}\n\n## Calculations\nResponse before: ${r.responseBefore.assertions}/${r.responseBefore.count} (${percent(r.responseBefore.rate)})\nResponse after: ${review.execution ? `${r.responseAfter.assertions}/${r.responseAfter.count} (${percent(r.responseAfter.rate)})` : 'Not evaluated'}\nComparison before: ${r.comparisonBefore.assertions}/${r.comparisonBefore.count} (${percent(r.comparisonBefore.rate)})\nComparison after: ${review.execution ? `${r.comparisonAfter.assertions}/${r.comparisonAfter.count} (${percent(r.comparisonAfter.rate)})` : 'Not evaluated'}\nObserved change: ${r.observed === null ? 'Unavailable' : r.observed.toFixed(1) + ' percentage points'}\nAdjusted difference = (response after − response before) − (comparison after − comparison before): ${r.adjusted === null ? 'Withheld' : r.adjusted.toFixed(1) + ' percentage points'}\nTarget status: ${r.targetMet === null ? 'Not assessable' : r.targetMet ? 'Met in sample' : 'Not met in sample'}\nEvidence status: ${r.evidence}\n\n## Reviewer-assessed conditions (not independently verified)\n${checkDefinitions.map(c => `${c.title}: ${review.checks[c.id] ? 'Marked checked' : 'Unresolved'}`).join('\n')}\n\n## Limits\nDescriptive fictional illustration, not a proven causal effect or a confidence probability. No statistical significance computed. The public-post sample does not measure the full population, views, understanding or resident complaint resolution. See the separate complaint track for fictional service outcomes. No publication API is called; receipt text is a local annotation.\n\n## Human review\n${review.signoff ? JSON.stringify(review.signoff, null, 2) : 'Pending'}\n\n## Local activity\n${review.history.map(h => `${h.at}: ${h.text}`).join('\n')}\n`;
}

import type { Cohort, Execution, Signoff } from './impact-model';

export type ServiceMode = 'verified' | 'closed-only' | 'missing';
export const serviceChecks = [
  { id: 'caseMix', title: 'Comparable complaint cohorts', detail: 'Check issue type, severity, baseline progress, workload and deadline eligibility.' },
  { id: 'spillover', title: 'Separate service follow-through', detail: 'Check whether comparison cases also received action C or the same staff support.' },
  { id: 'logging', title: 'Complete and consistent case records', detail: 'Same closure, confirmation and reopened-case rules in both groups.' },
  { id: 'otherActions', title: 'Other service changes investigated', detail: 'Check staffing changes, new notices and concurrent operational interventions.' },
] as const;
type ServiceCheck = typeof serviceChecks[number]['id'];
export type Confirmation = { reviewer: string; reference: string; note: string; recordedAt: string };
export type ServiceReview = {
  version: 1; goal: string; target: number; maxReopened: number; lockedAt: string | null; execution: Execution | null;
  mode: ServiceMode; checks: Record<ServiceCheck, boolean>; confirmations: Record<string, Confirmation>;
  signoff: Signoff | null; history: { at: string; text: string }[];
};
export type ServiceTicket = {
  id: string; cohort: Cohort; createdHour: number; baselineVerified: boolean; followupAvailable: boolean;
  closedHour: number | null; confirmationHour: number | null; reopened: boolean;
  officerReference: string | null; residentReference: string | null;
};
export const serviceRecommendation = 'Assign closure-status complaints to an officer, send a source-backed answer, and obtain resident confirmation before counting a verified resolution.';
export function initialService(example = true): ServiceReview {
  return { version: 1, goal: 'Resolve closure-status complaints with a documented answer and resident confirmation.', target: 70, maxReopened: 10,
    lockedAt: example ? 'Scenario Day 2 · 07:45 WIB' : null,
    execution: example ? { officer: 'Rani · fictional service officer', channel: 'Complaint follow-through queue', proof: 'ACTION-C / fictional assignment receipt', wording: serviceRecommendation, recordedAt: 'Scenario Day 2 · 12:00 WIB' } : null,
    mode: 'verified', checks: { caseMix: example, spillover: example, logging: example, otherActions: example }, confirmations: {}, signoff: null,
    history: example ? [{ at: 'Day 2 · 07:45', text: 'Example complaint plan locked independently of the public-narrative plan.' }, { at: 'Day 2 · 12:00', text: 'Action C: officer follow-through recorded separately from public clarification B.' }] : [],
  };
}
export function serviceTickets(review: ServiceReview): ServiceTicket[] {
  return (['response', 'comparison'] as Cohort[]).flatMap(cohort => Array.from({ length: 20 }, (_, index) => {
    const i = index + 1, id = `SC-${cohort === 'response' ? 'R' : 'C'}-${String(i).padStart(3, '0')}`;
    const available = !(review.mode === 'missing' && cohort === 'comparison');
    const verified = cohort === 'comparison' ? 6 : review.mode === 'closed-only' ? 6 : 14;
    const closed = cohort === 'response' ? 18 : 8;
    const reopened = cohort === 'response' && (i === 15 || i === 16);
    const eligibleConfirmation = available && i > verified && i <= closed && !reopened;
    const added = eligibleConfirmation ? review.confirmations[id] : undefined;
    return { id, cohort, createdHour: 7, baselineVerified: i <= 2, followupAvailable: available,
      closedHour: !available ? null : i <= 2 ? 10 + i / 4 : i <= closed ? 12 + (i - 3) % 4 : null,
      confirmationHour: !available ? null : i <= 2 ? 11 + i / 4 : i <= verified ? 12.5 + (i - 3) % 4 : added ? 15 + 59 / 60 : null,
      reopened: available && reopened,
      officerReference: available && i <= closed ? `ANSWER-${id}` : null,
      residentReference: !available ? null : i <= verified ? `CONFIRM-${id}` : added?.reference || null,
    };
  }));
}
export function verifiedTicket(ticket: ServiceTicket) {
  return ticket.followupAvailable && ticket.closedHour !== null && ticket.confirmationHour !== null && ticket.confirmationHour >= ticket.closedHour && ticket.confirmationHour <= 16 && !!ticket.officerReference && !!ticket.residentReference && !ticket.reopened;
}
export function serviceSummary(tickets: ServiceTicket[], cohort: Cohort) {
  const rows = tickets.filter(t => t.cohort === cohort), total = rows.length;
  const before = rows.filter(t => t.baselineVerified).length, observed = rows.filter(t => t.followupAvailable).length;
  const complete = total > 0 && observed === total;
  const verified = rows.filter(verifiedTicket).length, closed = rows.filter(t => t.followupAvailable && t.closedHour !== null).length;
  const reopened = rows.filter(t => t.followupAvailable && t.reopened).length;
  return { total, observed, before, verified: complete ? verified : null, closed: complete ? closed : null, reopened: complete ? reopened : null,
    beforeRate: total ? before / total * 100 : null, verifiedRate: complete ? verified / total * 100 : null,
    closedRate: complete ? closed / total * 100 : null, reopenedRate: complete ? reopened / total * 100 : null, complete };
}
export function evaluateService(review: ServiceReview) {
  const tickets = serviceTickets(review), response = serviceSummary(tickets, 'response'), comparison = serviceSummary(tickets, 'comparison');
  const eligible = !!review.execution && response.complete && comparison.complete && serviceChecks.every(c => review.checks[c.id]);
  const change = review.execution && response.verifiedRate !== null ? response.verifiedRate - response.beforeRate! : null;
  const comparisonChange = review.execution && comparison.verifiedRate !== null ? comparison.verifiedRate - comparison.beforeRate! : null;
  const adjusted = eligible && change !== null && comparisonChange !== null ? change - comparisonChange : null;
  return { tickets, response, comparison, eligible, change, comparisonChange, adjusted,
    targetMet: review.execution && response.complete ? response.verifiedRate! >= review.target && response.reopenedRate! <= review.maxReopened : null,
    evidence: !review.execution ? 'Awaiting service execution' : !response.complete || !comparison.complete ? 'Insufficient comparison data' : !eligible ? 'Observed service change only' : 'Comparison-supported example',
  };
}
export function servicePlanValid(review: ServiceReview) {
  return review.goal.trim().length >= 10 && Number.isFinite(review.target) && review.target >= 0 && review.target <= 100 && Number.isFinite(review.maxReopened) && review.maxReopened >= 0 && review.maxReopened <= 100;
}
export function lockService(review: ServiceReview, at: string): ServiceReview {
  if (review.lockedAt || !servicePlanValid(review)) return review;
  return { ...review, lockedAt: at, history: [...review.history, { at, text: `Service plan locked: ≥${review.target}% verified, ≤${review.maxReopened}% reopened by Day 2, 16:00 WIB.` }].slice(-50) };
}
export function executeService(review: ServiceReview, execution: Execution): ServiceReview {
  if (!review.lockedAt || review.execution || ![execution.officer, execution.channel, execution.proof, execution.wording].every(s => s.trim().length >= 3)) return review;
  return { ...review, execution: { ...execution }, history: [...review.history, { at: execution.recordedAt, text: 'Demo service action C recorded. Scenario time: Day 2, 12:00 WIB.' }].slice(-50) };
}
export function changeServiceEvidence(review: ServiceReview, patch: Partial<Pick<ServiceReview, 'mode' | 'checks'>>, at: string): ServiceReview {
  return { ...review, ...patch, confirmations: patch.mode !== undefined ? {} : review.confirmations, signoff: null,
    history: [...review.history, { at, text: patch.mode !== undefined ? 'Service scenario changed; demo confirmations and reviewer sign-off cleared.' : 'Service comparison conditions changed; reviewer sign-off cleared.' }].slice(-50) };
}
export function confirmServiceTicket(review: ServiceReview, id: string, confirmation: Confirmation): ServiceReview {
  const ticket = serviceTickets(review).find(t => t.id === id);
  if (!review.execution || !ticket || !ticket.followupAvailable || ticket.closedHour === null || !ticket.officerReference || ticket.reopened || verifiedTicket(ticket) || confirmation.reviewer.trim().length < 2 || confirmation.reference.trim().length < 3 || confirmation.note.trim().length < 10) return review;
  return { ...review, confirmations: { ...review.confirmations, [id]: { ...confirmation } }, signoff: null,
    history: [...review.history, { at: confirmation.recordedAt, text: `Demo resident confirmation recorded for ${id} at scenario 15:59 WIB; sign-off cleared.` }].slice(-50) };
}
export function signService(review: ServiceReview, signoff: Signoff): ServiceReview {
  if (!review.execution || signoff.reviewer.trim().length < 2 || signoff.note.trim().length < 10 || !['Continue monitoring', 'Revise the response', 'Collect more evidence'].includes(signoff.decision)) return review;
  return { ...review, signoff: { ...signoff }, history: [...review.history, { at: signoff.recordedAt, text: `Service reviewer: ${signoff.decision}.` }].slice(-50) };
}
export function parseService(raw: string | null, example = true): ServiceReview {
  try {
    const r = JSON.parse(raw || 'null'), text = (s: unknown): s is string => typeof s === 'string' && s.length <= 4000;
    if (!r || r.version !== 1 || !text(r.goal) || !servicePlanValid(r) || !(r.lockedAt === null || text(r.lockedAt)) || !['verified', 'closed-only', 'missing'].includes(r.mode) || !r.checks || !serviceChecks.every(c => typeof r.checks[c.id] === 'boolean') || !r.confirmations || typeof r.confirmations !== 'object' || Array.isArray(r.confirmations) || !Array.isArray(r.history) || r.history.length > 50 || !r.history.every((h: any) => h && text(h.at) && text(h.text))) return initialService(example);
    if (r.execution !== null && (!r.lockedAt || !r.execution || !['officer', 'channel', 'proof', 'wording', 'recordedAt'].every(k => text(r.execution[k])) || !['officer', 'channel', 'proof', 'wording'].every(k => r.execution[k].trim().length >= 3))) return initialService(example);
    const base = { ...r, confirmations: {} } as ServiceReview;
    for (const [id, confirmation] of Object.entries(r.confirmations) as [string, any][]) {
      if (!confirmation || !['reviewer', 'reference', 'note', 'recordedAt'].every(k => text(confirmation[k])) || confirmServiceTicket(base, id, confirmation) === base) return initialService(example);
    }
    if (r.signoff !== null && (!r.signoff || !['reviewer', 'decision', 'note', 'recordedAt'].every(k => text(r.signoff[k])) || signService({ ...r, signoff: null }, r.signoff).signoff === null)) return initialService(example);
    return r as ServiceReview;
  } catch { return initialService(example); }
}
export function dualOutcome(conversation: boolean | null, service: boolean | null) {
  if (conversation === null || service === null) return 'Evaluation incomplete';
  if (conversation && service) return 'Both outcome targets met';
  if (conversation || service) return 'Partial outcome success';
  return 'Neither outcome target met';
}
export function serviceReport(review: ServiceReview) {
  const r = evaluateService(review);
  return `## Resident complaints / linked service action C\n${serviceRecommendation}\n\nGoal: ${review.goal}\nLocked: ${review.lockedAt || 'Not locked'}\nTargets: ≥${review.target}% verified resolutions and ≤${review.maxReopened}% reopened, by Day 2 16:00 WIB.\nFixed cohort: 20 complaints per group registered by 08:00; includes two already verified by the 12:00 baseline in each group. No new arrivals are added to the denominator.\nExecution: ${review.execution ? JSON.stringify(review.execution) : 'Not recorded; follow-up not evaluated'}\n\n${review.execution ? `Response: ${r.response.verified}/${r.response.total} verified; ${r.response.closed}/${r.response.total} administratively closed; ${r.response.reopened}/${r.response.total} reopened.\nComparison follow-up observed: ${r.comparison.observed}/${r.comparison.total}; verified: ${r.comparison.verified === null ? 'Unavailable' : r.comparison.verified}.\nAdjusted difference: ${r.adjusted === null ? 'Withheld' : r.adjusted + ' percentage points'}.\nTarget status: ${r.targetMet === null ? 'Not assessable' : r.targetMet ? 'Met in cohort' : 'Not met in cohort'}.\nEvidence: ${r.evidence}.` : 'No post-action result.'}\n\nConditions (reviewer-assessed, not independently verified):\n${serviceChecks.map(c => `${c.title}: ${review.checks[c.id] ? 'Checked' : 'Unresolved'}`).join('\n')}\n\nVerification means officer evidence plus resident confirmation before cutoff, without reopening. This verifies an answer to an information complaint, not physical service restoration. All tickets, receipts and resident quotes are fictional; no real complaint system or resident contact is connected. B and C are separate actions; neither causal attribution nor statistical significance is established.\n\nRecorded demo confirmations:\n${JSON.stringify(review.confirmations, null, 2)}\nHuman service review:\n${review.signoff ? JSON.stringify(review.signoff) : 'Pending'}\nService activity:\n${review.history.map(h => `${h.at}: ${h.text}`).join('\n')}\n`;
}
export function serviceCsv(review: ServiceReview) {
  const cell = (value: unknown) => { const s = String(value ?? ''); return '"' + (/^[=+@\-\t\r]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"'; };
  return 'id,cohort,baseline_verified,followup_available,closed_hour_wib,confirmed_hour_wib,reopened,officer_reference,resident_reference,verified\n' + serviceTickets(review).map(t => [t.id, t.cohort, t.baselineVerified, !!review.execution && t.followupAvailable, review.execution ? t.closedHour : null, review.execution ? t.confirmationHour : null, review.execution ? t.reopened : null, review.execution ? t.officerReference : null, review.execution ? t.residentReference : null, review.execution && t.followupAvailable ? verifiedTicket(t) : null].map(cell).join(',')).join('\n');
}

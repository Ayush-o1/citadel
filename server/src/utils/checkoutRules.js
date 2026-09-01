// Shared between the alerts (Phase 04) and anomalies (Phase 05) modules —
// "an active checkout with no operator or site" is one underlying
// condition surfaced two ways: as a `missing_info` alert and a
// `missing_assignment` anomaly. Written once here so the two modules
// can't quietly drift apart (see Phase 04 task 04.4).
export function isOverdue(checkout, now = new Date()) {
  return (
    checkout.status === 'active' &&
    checkout.expected_return_at != null &&
    new Date(checkout.expected_return_at) < now
  );
}

export function isUpcomingReturn(checkout, now = new Date(), windowHours = 48) {
  if (checkout.status !== 'active' || checkout.expected_return_at == null) return false;
  const returnAt = new Date(checkout.expected_return_at);
  if (returnAt < now) return false; // already overdue, not "upcoming"
  const hoursUntil = (returnAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntil <= windowHours;
}

// Deliberately not status-gated: Phase 04's missing_info alert only ever
// calls this against active checkouts (its query pre-filters), but Phase
// 05's missing_assignment anomaly must also catch it on a completed
// historical checkout — the official EQX1002/EQX1007 sample rows are
// exactly this case (both returned, both with NULL operator/site).
export function hasMissingAssignment(checkout) {
  return checkout.operator_id == null || checkout.site_id == null;
}

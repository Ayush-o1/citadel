import { syncAndListAlerts } from '../alerts/alerts.service.js';
import { syncAndListAnomalies } from '../anomalies/anomalies.service.js';
import { computeAndListForecasts } from '../forecasts/forecasts.service.js';
import { getCapacitySummary } from '../capacity/capacity.service.js';
import * as repository from './recommendations.repository.js';
import { ApiError } from '../../utils/apiResponse.js';

// REQ-010/REQ-017 — the module the differentiation strategy hinges on
// (problem-statement/ANALYSIS.md §12): every alert/anomaly/forecast
// collapses into one signal -> reason -> action -> expected impact item.
//
// This is the one deliberate exception to ARCHITECTURE.md's "no feature
// module imports another" rule: recommendations calls the other feature
// modules' public service functions (not their repositories, and none of
// their detection RULES are re-derived here) specifically because it is
// the aggregation layer by design — Phase 07's own spec describes its
// inputs as "Phase 04's alerts, Phase 05's anomalies, Phase 06's
// forecasts... read-only from this module's perspective." RB-6 (2026-09-01)
// extends this same relationship to capacity. Calling their service
// functions is how it gets freshly-synced data without duplicating a
// single detection rule. See DECISIONS.md.
const ANOMALY_ACTIONS = {
  excessive_idle: 'reassign',
  zero_runtime: 'investigate',
  missing_assignment: 'investigate',
  unusual_movement: 'investigate',
};

const ANOMALY_IMPACT = {
  excessive_idle:
    'Simulated: reassigning or returning this equipment could improve utilization toward the 65-75% healthy band.',
  zero_runtime: 'Simulated: investigating could recover unused rental cost.',
  missing_assignment: 'Simulated: assigning an operator/site would restore who/what/where/when visibility.',
  unusual_movement: 'Simulated: investigating could confirm whether the asset is at an unexpected location.',
};

function buildAlertCandidates(alerts) {
  // upcoming_return is explicitly informational only (Phase 07 mapping
  // table) — no action needed yet, so no recommendation for it.
  return alerts
    .filter((a) => a.type === 'overdue')
    .map((a) => ({
      sourceType: 'alert',
      sourceId: a.id,
      equipmentId: a.equipment_id,
      signal: `${a.equipment_code}: overdue`,
      reason: a.message,
      action: 'return',
      expectedImpact: 'Simulated: returning this equipment could avoid further rental cost and free it up for reassignment.',
    }));
}

function buildAnomalyCandidates(anomalies) {
  return anomalies.map((a) => ({
    sourceType: 'anomaly',
    sourceId: a.id,
    equipmentId: a.equipment_id,
    signal: `${a.equipment_code}: ${a.type.replace(/_/g, ' ')}`,
    reason: a.reason,
    action: ANOMALY_ACTIONS[a.type] ?? 'investigate',
    expectedImpact: ANOMALY_IMPACT[a.type] ?? 'Simulated: investigating could resolve this anomaly.',
  }));
}

function buildForecastCandidates(forecasts) {
  // Only an upward-trending, well-supported forecast is actionable
  // ("high predicted demand" in the mapping table) — flat/down forecasts
  // and insufficient-history entries don't belong in the Action Queue.
  return forecasts
    .filter((f) => !f.insufficient_history && f.trend === 'up')
    .map((f) => ({
      sourceType: 'forecast',
      sourceId: f.id,
      equipmentId: null,
      signal: `${f.equipment_type} demand trending up at ${f.site.code}`,
      reason: f.factors,
      action: 'extend',
      expectedImpact: `Simulated: extending or pre-positioning ${f.equipment_type} stock at ${f.site.code} could avoid a stockout.`,
    }));
}

// Only a confident, flagged signal (a real typical-workload baseline
// behind it, and the completion range's high end still leaves >20% of the
// rental unused) becomes a recommendation -- an insufficient_history
// capacity signal stays informational-only (visible via GET /api/capacity)
// same as forecasts' insufficient_history entries never becoming a
// recommendation. source_id is the checkout_id (see migration 009): at
// most one open active checkout per equipment, so it's a stable key for
// insert-once/refresh-while-pending across recomputes.
function buildCapacityCandidates(capacitySignals) {
  return capacitySignals
    .filter((s) => s.underutilized_capacity)
    .map((s) => ({
      sourceType: 'capacity',
      sourceId: s.checkout_id,
      equipmentId: s.equipment_id,
      signal: `${s.equipment_code}: underutilized capacity`,
      reason: `Operating at ~${Math.round(s.utilization_ratio * 100)}% of assumed capacity (${s.observed_daily_rate}h/day vs. an assumed ${s.assumed_capacity_hours}h/day) -- current pace suggests the typical workload for this equipment type completes in ${s.estimated_completion_days_low}-${s.estimated_completion_days_high} days, well inside the ${s.remaining_rental_days}-day remaining rental window.`,
      action: 'investigate',
      expectedImpact:
        'Simulated: reviewing for early return or reassignment could free this equipment for the next job sooner.',
    }));
}

async function syncRecommendations(candidates) {
  for (const candidate of candidates) {
    const existing = await repository.findBySource(candidate.sourceType, candidate.sourceId);
    // Insert-once for status: once a recommendation exists for a given
    // source, only its own status (pending/actioned/dismissed) owns its
    // fate — a still-open underlying alert/anomaly must not resurrect a
    // recommendation the user already actioned or dismissed (REQ-017's
    // "closes the loop visibly" would otherwise be undone on every poll).
    // But while it's still pending, its wording is refreshed each sync
    // (e.g. an overdue alert's "expected back <date>" text) so it never
    // goes stale while sitting in the queue.
    if (!existing) {
      await repository.insert(candidate);
    } else if (existing.status === 'pending') {
      await repository.updateContent(existing.id, candidate);
    }
  }
}

export async function syncAndListRecommendations() {
  const [alerts, anomalies, forecasts, capacity] = await Promise.all([
    syncAndListAlerts(),
    syncAndListAnomalies(),
    computeAndListForecasts(),
    getCapacitySummary(),
  ]);

  const candidates = [
    ...buildAlertCandidates(alerts),
    ...buildAnomalyCandidates(anomalies),
    ...buildForecastCandidates(forecasts),
    ...buildCapacityCandidates(capacity.active_checkouts),
  ];

  await syncRecommendations(candidates);
  return repository.findActive();
}

export async function updateRecommendationStatus(id, status) {
  const existing = await repository.findById(id);
  if (!existing) throw new ApiError(404, 'Recommendation not found');
  if (existing.status !== 'pending') {
    throw new ApiError(409, `Recommendation is already ${existing.status}`);
  }
  return repository.updateStatus(id, status);
}

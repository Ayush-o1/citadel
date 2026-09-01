import * as repository from './capacity.repository.js';
import { HEALTHY_MIN, HEALTHY_MAX } from '../../utils/utilizationBand.js';

// Capacity-aware rental optimization (RB-6, .ai/FRONTEND-REBUILD-PLAN.md
// section 4). Rule-based and explainable, same style as alerts/anomalies/
// forecasts -- no ML, every number traces to either real seeded data or a
// stated assumption. Recomputed fresh on every GET, same sync-on-read
// pattern as alerts/anomalies (no cron/background job at this scale).
//
// Method, in order:
//   1. Assumed rated capacity per equipment type (a documented estimate,
//      not measured per-machine -- surfaced to the UI as an assumption).
//   2. Observed daily rate = avg(engine_hours) over that checkout's own
//      logged days (>=3 days required -- same minimum-evidence bar as
//      anomalies' zero_runtime/excessive_idle checks).
//   3. utilization_ratio = observed rate / assumed capacity. Only ratios
//      below the existing 65% healthy-band floor (utilization.service.js)
//      are worth saying anything about -- healthy/overutilized machines
//      produce no capacity signal at all (nothing actionable to show).
//   4. "Typical workload" baseline = median total engine_hours across
//      historical RETURNED checkouts of the same equipment type that
//      themselves fell in the 65-75% healthy band -- real historical data,
//      not invented, and gated at >=3 samples before being trusted.
//   5. Estimated completion = typical baseline / this rental's observed
//      rate, reported as a +/-20% range, never a false-precision point
//      number. Only flagged "underutilized_capacity" (recommendation-
//      worthy) when the high end of that range still leaves >20% of the
//      contracted rental window unused -- comfortably inside the
//      uncertainty band, not a hair-trigger.
const CAPACITY_HOURS_PER_DAY = { Excavator: 8, Bulldozer: 8, Crane: 6, Grader: 7 };
const DEFAULT_CAPACITY_HOURS_PER_DAY = 8; // fallback for any type not in the map above

const MIN_LOGGED_DAYS = 3;
const MIN_BASELINE_SAMPLES = 3;
const COMPLETION_RANGE_SLACK = 0.2; // +/-20% around the point estimate
const SIGNIFICANT_SLACK = 0.2; // remaining days must exceed the high estimate by this much to flag

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function buildBaselines(historicalRows) {
  const totalsByType = new Map();
  for (const row of historicalRows) {
    const engine = Number(row.total_engine_hours);
    const idle = Number(row.total_idle_hours);
    const ratio = engine / (engine + idle);
    if (ratio < HEALTHY_MIN || ratio > HEALTHY_MAX) continue;
    if (!totalsByType.has(row.equipment_type)) totalsByType.set(row.equipment_type, []);
    totalsByType.get(row.equipment_type).push(engine);
  }

  const baselines = new Map();
  for (const [type, totals] of totalsByType) {
    baselines.set(type, {
      medianTotalHours: Math.round(median(totals) * 10) / 10,
      sampleCount: totals.length,
    });
  }
  return baselines;
}

function daysBetween(from, to) {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
}

function capacityFor(equipmentType) {
  return CAPACITY_HOURS_PER_DAY[equipmentType] ?? DEFAULT_CAPACITY_HOURS_PER_DAY;
}

export async function getCapacitySummary() {
  const now = new Date();
  const [activeRows, historicalRows] = await Promise.all([
    repository.findActiveCheckoutDailyUsage(),
    repository.findHistoricalCheckoutTotals(),
  ]);
  const baselines = buildBaselines(historicalRows);

  const activeCheckouts = [];
  for (const row of activeRows) {
    const logCount = Number(row.log_count);
    if (logCount < MIN_LOGGED_DAYS) continue; // not enough evidence yet -- say nothing

    const capacity = capacityFor(row.equipment_type);
    const observedDailyRate = Math.round(Number(row.avg_engine_hours) * 100) / 100;
    const utilizationRatio = capacity > 0 ? Math.round((observedDailyRate / capacity) * 1000) / 1000 : null;
    if (utilizationRatio === null || utilizationRatio >= HEALTHY_MIN) continue; // healthy/overutilized: nothing to say

    const baseline = baselines.get(row.equipment_type);
    const assumptions = [
      `Assumed capacity: ${capacity} productive hour(s)/day for ${row.equipment_type} (a documented estimate, not measured per machine).`,
    ];

    if (!baseline || baseline.sampleCount < MIN_BASELINE_SAMPLES) {
      activeCheckouts.push({
        checkout_id: row.checkout_id,
        equipment_id: row.equipment_id,
        equipment_code: row.equipment_code,
        equipment_type: row.equipment_type,
        utilization_ratio: utilizationRatio,
        assumed_capacity_hours: capacity,
        observed_daily_rate: observedDailyRate,
        underutilized_capacity: false,
        insufficient_history: true,
        note: `Only ${baseline?.sampleCount ?? 0} comparable healthy-utilization ${row.equipment_type} rental(s) on record -- not enough history for a completion estimate.`,
        assumptions,
      });
      continue;
    }

    assumptions.push(
      `Typical workload baseline: median ${baseline.medianTotalHours}h of engine time across ${baseline.sampleCount} historical ${row.equipment_type} rentals that fell in the 65-75% healthy utilization band.`
    );

    const estimatedDays = baseline.medianTotalHours / observedDailyRate;
    const low = Math.max(1, Math.round(estimatedDays * (1 - COMPLETION_RANGE_SLACK)));
    const high = Math.round(estimatedDays * (1 + COMPLETION_RANGE_SLACK));

    const remainingDays = row.expected_return_at
      ? Math.round(daysBetween(now, new Date(row.expected_return_at)))
      : null;
    const underutilizedCapacity = remainingDays !== null && remainingDays > high * (1 + SIGNIFICANT_SLACK);

    activeCheckouts.push({
      checkout_id: row.checkout_id,
      equipment_id: row.equipment_id,
      equipment_code: row.equipment_code,
      equipment_type: row.equipment_type,
      utilization_ratio: utilizationRatio,
      assumed_capacity_hours: capacity,
      observed_daily_rate: observedDailyRate,
      typical_total_hours: baseline.medianTotalHours,
      typical_sample_count: baseline.sampleCount,
      estimated_completion_days_low: low,
      estimated_completion_days_high: high,
      remaining_rental_days: remainingDays,
      underutilized_capacity: underutilizedCapacity,
      insufficient_history: false,
      assumptions,
    });
  }

  // Type-level baselines, independent of any specific active rental --
  // lets the Customer role see "what's typical for this equipment type"
  // before they've logged a single hour of their own usage (there's no
  // "observed rate" for a rental that hasn't started). Only types with a
  // trustworthy sample count are surfaced; never fabricated for a type
  // with too little history.
  const typeBaselines = [...baselines.entries()]
    .filter(([, baseline]) => baseline.sampleCount >= MIN_BASELINE_SAMPLES)
    .map(([type, baseline]) => ({
      equipment_type: type,
      assumed_capacity_hours: capacityFor(type),
      typical_total_hours: baseline.medianTotalHours,
      sample_count: baseline.sampleCount,
    }));

  return { active_checkouts: activeCheckouts, type_baselines: typeBaselines };
}

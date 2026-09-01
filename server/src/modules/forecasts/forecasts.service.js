import * as repository from './forecasts.repository.js';

// REQ-009/REQ-019. Method choice (DECISIONS.md "Phase 06: forecast
// method"): a plain trailing-window average over the last 4 weeks, not
// exponential smoothing — with only 2-4 data points per group at this
// data scale, a decaying-weight average has no real advantage and is
// harder to explain under panel questioning than "we averaged the last
// N checkouts." Sufficiency is judged by raw checkout count in the
// window (>= 3), not by how many distinct weekly buckets have activity —
// bucket-boundary edge cases (a checkout landing just inside/outside a
// 7-day cutoff) made period-counting an unreliable sufficiency signal at
// this sample size; a plain count threshold doesn't have that problem.
const LOOKBACK_DAYS = 28;
const MIN_CHECKOUTS = 3;
const RECENT_HALF_DAYS = 14;

function groupCheckouts(checkouts) {
  const groups = new Map();
  for (const c of checkouts) {
    const key = `${c.equipment_type}::${c.site_id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        equipmentType: c.equipment_type,
        siteId: c.site_id,
        siteCode: c.site_code,
        dates: [],
      });
    }
    groups.get(key).dates.push(new Date(c.checked_out_at));
  }
  return groups;
}

function computeTrend(dates, now) {
  const cutoff = now.getTime() - RECENT_HALF_DAYS * 24 * 60 * 60 * 1000;
  const recent = dates.filter((d) => d.getTime() >= cutoff).length;
  const previous = dates.length - recent;
  if (recent > previous) return 'up';
  if (recent < previous) return 'down';
  return 'flat';
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export async function computeAndListForecasts() {
  const now = new Date();
  const checkouts = await repository.findRecentCheckouts(LOOKBACK_DAYS);
  const groups = groupCheckouts(checkouts);
  const weeks = LOOKBACK_DAYS / 7;
  const results = [];

  for (const group of groups.values()) {
    const count = group.dates.length;
    const site = { id: group.siteId, code: group.siteCode };

    if (count < MIN_CHECKOUTS) {
      results.push({
        equipment_type: group.equipmentType,
        site,
        insufficient_history: true,
        checkout_count: count,
        note: `Only ${count} checkout(s) in the last ${weeks} weeks — not enough history to forecast confidently.`,
      });
      continue;
    }

    const avgPerWeek = Math.round((count / weeks) * 100) / 100;
    const trend = computeTrend(group.dates, now);
    const periodStart = toDateOnly(now);
    const periodEnd = toDateOnly(new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000));
    const method = `trailing-window average (last ${weeks} weeks)`;
    const factors = `Based on ${count} checkout(s) over the last ${weeks} weeks (~${avgPerWeek}/week), trending ${trend}.`;

    const forecast = await repository.replaceForecast({
      equipmentType: group.equipmentType,
      siteId: group.siteId,
      periodStart,
      periodEnd,
      predictedDemand: avgPerWeek,
      method,
      factors,
    });

    results.push({
      equipment_type: forecast.equipment_type,
      site,
      // Use the date-only strings computed above, not pg's round-tripped
      // `forecast.period_start`/`period_end` — node-pg parses a DATE
      // column into a JS Date at local midnight, which then serializes to
      // JSON a day off in any timezone behind UTC. The DB value is
      // correct; only the naive round-trip-and-reserialize is not.
      period_start: periodStart,
      period_end: periodEnd,
      predicted_demand: Number(forecast.predicted_demand),
      method: forecast.method,
      factors: forecast.factors,
      insufficient_history: false,
    });
  }

  return results;
}

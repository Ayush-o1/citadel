import { query } from '../../config/db.js';

// One row per active checkout: the observed daily productive rate (avg
// engine_hours across logged days) that drives the utilization-vs-capacity
// comparison. LEFT JOIN so a checkout with zero logs still surfaces
// (log_count = 0), letting the service apply its own minimum-evidence gate
// rather than the query silently dropping it.
export async function findActiveCheckoutDailyUsage() {
  const { rows } = await query(`
    SELECT
      c.id AS checkout_id,
      c.equipment_id,
      e.equipment_code,
      e.type AS equipment_type,
      c.checked_out_at,
      c.expected_return_at,
      COALESCE(AVG(ul.engine_hours), 0) AS avg_engine_hours,
      COUNT(ul.id) AS log_count
    FROM checkouts c
    JOIN equipment e ON e.id = c.equipment_id
    LEFT JOIN usage_logs ul ON ul.checkout_id = c.id
    WHERE c.status = 'active'
    GROUP BY c.id, c.equipment_id, e.equipment_code, e.type, c.checked_out_at, c.expected_return_at
  `);
  return rows;
}

// Per-checkout totals for every *historical, returned* rental that has at
// least one usage log -- the raw material for the "typical workload"
// baseline. Filtering to the healthy utilization band happens in the
// service layer (reuses the same 65-75% band as utilization.service.js),
// not here, so the threshold stays in one place conceptually even though
// it's duplicated as a literal -- see capacity.service.js's comment.
export async function findHistoricalCheckoutTotals() {
  const { rows } = await query(`
    SELECT
      c.id AS checkout_id,
      e.type AS equipment_type,
      SUM(ul.engine_hours) AS total_engine_hours,
      SUM(ul.idle_hours) AS total_idle_hours
    FROM checkouts c
    JOIN equipment e ON e.id = c.equipment_id
    JOIN usage_logs ul ON ul.checkout_id = c.id
    WHERE c.status = 'returned'
    GROUP BY c.id, e.type
    HAVING SUM(ul.engine_hours) + SUM(ul.idle_hours) > 0
  `);
  return rows;
}

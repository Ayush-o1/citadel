import { query } from '../../config/db.js';

export async function findRecentCheckouts(lookbackDays) {
  const { rows } = await query(
    `SELECT e.type AS equipment_type, c.site_id, cs.code AS site_code, c.checked_out_at
     FROM checkouts c
     JOIN equipment e ON e.id = c.equipment_id
     JOIN sites cs ON cs.id = c.site_id
     WHERE c.site_id IS NOT NULL
       AND c.checked_out_at >= now() - ($1 || ' days')::interval`,
    [lookbackDays]
  );
  return rows;
}

// One forecast row per (equipment_type, site) — replaced wholesale on
// every recompute rather than accumulated, since only the latest forecast
// per group is meaningful (the table has no status/lifecycle column the
// way alerts/anomalies do, so there's nothing for an old row to resolve
// into; keeping history isn't a requirement here).
export async function replaceForecast({
  equipmentType,
  siteId,
  periodStart,
  periodEnd,
  predictedDemand,
  method,
  factors,
}) {
  await query('DELETE FROM forecasts WHERE equipment_type = $1 AND site_id = $2', [equipmentType, siteId]);
  const { rows } = await query(
    `INSERT INTO forecasts (equipment_type, site_id, period_start, period_end, predicted_demand, method, factors)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [equipmentType, siteId, periodStart, periodEnd, predictedDemand, method, factors]
  );
  return rows[0];
}

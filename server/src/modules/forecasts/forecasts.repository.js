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

// One forecast row per (equipment_type, site), upserted (not
// delete-then-insert) so its id stays stable across recomputes — Phase 07
// references a forecast's id as recommendations.source_id, which would
// break (a fresh id, and a fresh "new" recommendation, on every single
// poll) if this recreated the row every time instead of updating it in
// place. The table has no status/lifecycle column the way alerts/
// anomalies do, so there's nothing else for an old row to resolve into.
export async function upsertForecast({
  equipmentType,
  siteId,
  periodStart,
  periodEnd,
  predictedDemand,
  method,
  factors,
}) {
  const existing = await query('SELECT id FROM forecasts WHERE equipment_type = $1 AND site_id = $2', [
    equipmentType,
    siteId,
  ]);

  if (existing.rows[0]) {
    const { rows } = await query(
      `UPDATE forecasts
       SET period_start = $2, period_end = $3, predicted_demand = $4, method = $5, factors = $6, generated_at = now()
       WHERE id = $1
       RETURNING *`,
      [existing.rows[0].id, periodStart, periodEnd, predictedDemand, method, factors]
    );
    return rows[0];
  }

  const { rows } = await query(
    `INSERT INTO forecasts (equipment_type, site_id, period_start, period_end, predicted_demand, method, factors)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [equipmentType, siteId, periodStart, periodEnd, predictedDemand, method, factors]
  );
  return rows[0];
}

import { query } from '../../config/db.js';

export async function findAllCheckoutsWithEquipment() {
  const { rows } = await query(`
    SELECT
      c.id AS checkout_id, c.equipment_id, e.equipment_code,
      c.operator_id, c.site_id, cs.code AS site_code, c.status
    FROM checkouts c
    JOIN equipment e ON e.id = c.equipment_id
    LEFT JOIN sites cs ON cs.id = c.site_id
  `);
  return rows;
}

export async function findUsageAggregatesByCheckout() {
  const { rows } = await query(`
    SELECT
      checkout_id,
      COALESCE(SUM(engine_hours), 0) AS total_engine_hours,
      COALESCE(SUM(idle_hours), 0)   AS total_idle_hours,
      COUNT(*)                       AS log_count,
      bool_or(engine_hours = 0)      AS has_zero_runtime_day
    FROM usage_logs
    GROUP BY checkout_id
  `);
  return rows;
}

export async function findLoggedLocationsByCheckout() {
  const { rows } = await query(`
    SELECT DISTINCT checkout_id, location
    FROM usage_logs
    WHERE location IS NOT NULL
  `);
  return rows;
}

export async function findOpenKeys() {
  const { rows } = await query(`SELECT id, checkout_id, type FROM anomalies WHERE status = 'open'`);
  return rows;
}

// ON CONFLICT DO NOTHING against idx_anomalies_one_open_per_checkout_type
// (migration 011): the service layer's check-then-act sync already tries
// to avoid inserting a duplicate, but that check has no atomicity
// guarantee against a second concurrent sync doing the same thing at the
// same time -- this is what actually prevents the duplicate at the
// database level instead of just making it less likely.
export async function insertAnomaly({ equipmentId, checkoutId, type, reason, severity }) {
  await query(
    `INSERT INTO anomalies (equipment_id, checkout_id, type, reason, severity)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (checkout_id, type) WHERE status = 'open' DO NOTHING`,
    [equipmentId, checkoutId, type, reason, severity]
  );
}

export async function resolveAnomaly(id) {
  await query(`UPDATE anomalies SET status = 'resolved' WHERE id = $1`, [id]);
}

export async function findAllOpen() {
  const { rows } = await query(`
    SELECT a.*, e.equipment_code
    FROM anomalies a
    JOIN equipment e ON e.id = a.equipment_id
    WHERE a.status = 'open'
    ORDER BY (a.severity = 'high') DESC, a.detected_at DESC
  `);
  return rows;
}

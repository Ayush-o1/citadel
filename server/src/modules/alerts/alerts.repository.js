import { query } from '../../config/db.js';

export async function findActiveCheckoutsWithEquipment() {
  const { rows } = await query(`
    SELECT
      c.id AS checkout_id, c.equipment_id, e.equipment_code,
      c.operator_id, c.site_id, c.checked_out_at, c.expected_return_at, c.status
    FROM checkouts c
    JOIN equipment e ON e.id = c.equipment_id
    WHERE c.status = 'active'
  `);
  return rows;
}

export async function findOpenKeys() {
  const { rows } = await query(`SELECT id, checkout_id, type FROM alerts WHERE status = 'open'`);
  return rows;
}

// ON CONFLICT DO NOTHING against idx_alerts_one_open_per_checkout_type
// (migration 011) -- see anomalies.repository.js's insertAnomaly for why
// this matters: the service layer's check-then-act sync alone can't
// prevent two concurrent syncs from both inserting the same signal.
export async function insertAlert({ equipmentId, checkoutId, type, message, severity }) {
  await query(
    `INSERT INTO alerts (equipment_id, checkout_id, type, message, severity)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (checkout_id, type) WHERE status = 'open' DO NOTHING`,
    [equipmentId, checkoutId, type, message, severity]
  );
}

export async function resolveAlert(id) {
  await query(`UPDATE alerts SET status = 'resolved', resolved_at = now() WHERE id = $1`, [id]);
}

export async function findAllOpen() {
  const { rows } = await query(`
    SELECT a.*, e.equipment_code
    FROM alerts a
    JOIN equipment e ON e.id = a.equipment_id
    WHERE a.status = 'open'
    ORDER BY (a.severity = 'high') DESC, a.created_at DESC
  `);
  return rows;
}

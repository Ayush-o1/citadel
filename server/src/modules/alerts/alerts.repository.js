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

export async function insertAlert({ equipmentId, checkoutId, type, message, severity }) {
  await query(
    `INSERT INTO alerts (equipment_id, checkout_id, type, message, severity)
     VALUES ($1, $2, $3, $4, $5)`,
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

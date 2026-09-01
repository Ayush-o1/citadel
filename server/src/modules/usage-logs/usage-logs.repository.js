import { query } from '../../config/db.js';

export async function findCheckoutById(checkoutId) {
  const { rows } = await query('SELECT id, equipment_id, status FROM checkouts WHERE id = $1', [checkoutId]);
  return rows[0] ?? null;
}

export async function insert({
  checkoutId,
  equipmentId,
  loggedAt,
  engineHours,
  idleHours,
  fuelLevel,
  location,
  conditionNote,
}) {
  const { rows } = await query(
    `INSERT INTO usage_logs (checkout_id, equipment_id, logged_at, engine_hours, idle_hours, fuel_level, location, condition_note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [checkoutId, equipmentId, loggedAt, engineHours, idleHours, fuelLevel ?? null, location ?? null, conditionNote ?? null]
  );
  return rows[0];
}

export async function findByCheckout(checkoutId) {
  const { rows } = await query('SELECT * FROM usage_logs WHERE checkout_id = $1 ORDER BY logged_at', [checkoutId]);
  return rows;
}

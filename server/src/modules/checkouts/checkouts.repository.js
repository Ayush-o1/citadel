import { query } from '../../config/db.js';

export async function findEquipmentById(client, equipmentId) {
  const { rows } = await client.query('SELECT id, status FROM equipment WHERE id = $1', [equipmentId]);
  return rows[0] ?? null;
}

export async function findActiveByEquipment(client, equipmentId) {
  const { rows } = await client.query(
    `SELECT id FROM checkouts WHERE equipment_id = $1 AND status = 'active'`,
    [equipmentId]
  );
  return rows[0] ?? null;
}

export async function insertCheckout(
  client,
  { equipmentId, operatorId, siteId, expectedReturnAt, conditionOut, customerName }
) {
  const { rows } = await client.query(
    `INSERT INTO checkouts (equipment_id, operator_id, site_id, checked_out_at, expected_return_at, status, condition_out, customer_name)
     VALUES ($1, $2, $3, now(), $4, 'active', $5, $6)
     RETURNING *`,
    [equipmentId, operatorId ?? null, siteId ?? null, expectedReturnAt ?? null, conditionOut ?? null, customerName ?? null]
  );
  return rows[0];
}

export async function markEquipmentCheckedOut(client, equipmentId) {
  await client.query(`UPDATE equipment SET status = 'checked_out' WHERE id = $1`, [equipmentId]);
}

export async function markEquipmentAvailable(client, equipmentId) {
  await client.query(`UPDATE equipment SET status = 'available' WHERE id = $1`, [equipmentId]);
}

// Conditional UPDATE (status = 'active' in the WHERE clause) means this
// returns no row if the checkout was already returned — the service uses
// that to distinguish "already checked in" from "never existed".
export async function checkIn(client, checkoutId, { conditionIn }) {
  const { rows } = await client.query(
    `UPDATE checkouts
     SET status = 'returned', checked_in_at = now(), condition_in = $2
     WHERE id = $1 AND status = 'active'
     RETURNING *`,
    [checkoutId, conditionIn ?? null]
  );
  return rows[0] ?? null;
}

export async function findStatusById(client, checkoutId) {
  const { rows } = await client.query('SELECT status FROM checkouts WHERE id = $1', [checkoutId]);
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await query('SELECT * FROM checkouts WHERE id = $1', [id]);
  return rows[0] ?? null;
}

const LIST_SELECT = `
  SELECT c.*, e.equipment_code, e.type AS equipment_type
  FROM checkouts c
  JOIN equipment e ON e.id = c.equipment_id
`;

export async function findAll({ status, customerName } = {}) {
  const clauses = [];
  const params = [];
  if (status) {
    params.push(status);
    clauses.push(`c.status = $${params.length}`);
  }
  if (customerName) {
    params.push(customerName);
    clauses.push(`c.customer_name = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await query(`${LIST_SELECT} ${where} ORDER BY c.checked_out_at DESC`, params);
  return rows;
}

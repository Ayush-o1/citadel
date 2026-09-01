import { query } from '../../config/db.js';

const BASE_SELECT = `
  SELECT
    e.id,
    e.equipment_code       AS code,
    e.type,
    e.status               AS base_status,
    e.created_at,
    hs.id                  AS home_site_id,
    hs.code                AS home_site_code,
    c.id                   AS active_checkout_id,
    c.checked_out_at       AS active_checked_out_at,
    c.expected_return_at   AS active_expected_return_at,
    c.operator_id          AS active_operator_id,
    op.code                AS active_operator_code,
    cs.id                  AS active_site_id,
    cs.code                AS active_site_code
  FROM equipment e
  LEFT JOIN sites hs     ON hs.id = e.home_site_id
  LEFT JOIN checkouts c  ON c.equipment_id = e.id AND c.status = 'active'
  LEFT JOIN operators op ON op.id = c.operator_id
  LEFT JOIN sites cs     ON cs.id = c.site_id
`;

export async function findAll() {
  const { rows } = await query(`${BASE_SELECT} ORDER BY e.equipment_code`);
  return rows;
}

export async function findById(id) {
  const { rows } = await query(`${BASE_SELECT} WHERE e.id = $1`, [id]);
  return rows[0] ?? null;
}

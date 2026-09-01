import { query } from '../../config/db.js';

export async function findBySource(sourceType, sourceId) {
  const { rows } = await query(
    'SELECT * FROM recommendations WHERE source_type = $1 AND source_id = $2',
    [sourceType, sourceId]
  );
  return rows[0] ?? null;
}

export async function insert({ sourceType, sourceId, equipmentId, signal, reason, action, expectedImpact }) {
  await query(
    `INSERT INTO recommendations (source_type, source_id, equipment_id, signal, reason, action, expected_impact)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [sourceType, sourceId, equipmentId, signal, reason, action, expectedImpact]
  );
}

// Keeps a still-pending recommendation's wording current (e.g. an
// overdue alert's "expected back <date>" text) without touching its
// status — an actioned/dismissed recommendation is never passed here,
// since the sync loop only calls this when findBySource found a
// `pending` row (see recommendations.service.js).
export async function updateContent(id, { signal, reason, action, expectedImpact }) {
  await query(
    `UPDATE recommendations
     SET signal = $2, reason = $3, action = $4, expected_impact = $5
     WHERE id = $1`,
    [id, signal, reason, action, expectedImpact]
  );
}

export async function findById(id) {
  const { rows } = await query('SELECT * FROM recommendations WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function updateStatus(id, status) {
  const { rows } = await query(
    `UPDATE recommendations
     SET status = $2, actioned_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );
  return rows[0] ?? null;
}

// Ranked: alert/anomaly-sourced items before forecast-sourced ones
// (Phase 07 spec: "overdue/anomaly first, forecast-driven suggestions
// lower"), then oldest-surfaced-first within each tier.
export async function findActive() {
  const { rows } = await query(`
    SELECT r.*, e.equipment_code
    FROM recommendations r
    LEFT JOIN equipment e ON e.id = r.equipment_id
    WHERE r.status = 'pending'
    ORDER BY (r.source_type = 'forecast') ASC, r.created_at ASC
  `);
  return rows;
}

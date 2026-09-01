import { query } from '../../src/config/db.js';

// Test fixtures are always created fresh and deleted at the end of the
// test that made them — never mutate the Phase 02 seeded rows directly.
// Several later phases (04-06) and the demo depend on that seeded data
// existing exactly as documented in STATE.md.
export async function pickSiteId() {
  const { rows } = await query('SELECT id FROM sites ORDER BY code LIMIT 1');
  return rows[0].id;
}

export async function pickOperatorId() {
  const { rows } = await query('SELECT id FROM operators ORDER BY code LIMIT 1');
  return rows[0].id;
}

export async function createFixtureEquipment(suffix) {
  const siteId = await pickSiteId();
  const code = `TEST-EQX-${suffix}-${Date.now()}`;
  const { rows } = await query(
    `INSERT INTO equipment (equipment_code, type, home_site_id, status)
     VALUES ($1, 'Excavator', $2, 'available')
     RETURNING id, equipment_code AS code`,
    [code, siteId]
  );
  return rows[0];
}

// Deletion order matters: every analytics table (alerts/anomalies/
// recommendations) has an ON DELETE RESTRICT FK to equipment, same as
// usage_logs/checkouts — all must be cleared before the equipment row
// itself, or the final DELETE throws a foreign-key-violation.
export async function deleteFixtureEquipment(equipmentId) {
  await query('DELETE FROM recommendations WHERE equipment_id = $1', [equipmentId]);
  await query('DELETE FROM anomalies WHERE equipment_id = $1', [equipmentId]);
  await query('DELETE FROM alerts WHERE equipment_id = $1', [equipmentId]);
  await query('DELETE FROM usage_logs WHERE equipment_id = $1', [equipmentId]);
  await query('DELETE FROM checkouts WHERE equipment_id = $1', [equipmentId]);
  await query('DELETE FROM equipment WHERE id = $1', [equipmentId]);
}

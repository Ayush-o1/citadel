import { query } from '../../config/db.js';

export async function findUsageByEquipmentType() {
  const { rows } = await query(`
    SELECT
      e.type AS equipment_type,
      COALESCE(SUM(u.engine_hours), 0) AS total_engine_hours,
      COALESCE(SUM(u.idle_hours), 0)   AS total_idle_hours
    FROM equipment e
    LEFT JOIN usage_logs u ON u.equipment_id = e.id
    GROUP BY e.type
    ORDER BY e.type
  `);
  return rows;
}

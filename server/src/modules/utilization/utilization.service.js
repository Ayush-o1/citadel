import * as repository from './utilization.repository.js';
import { HEALTHY_MIN, HEALTHY_MAX } from '../../utils/utilizationBand.js';

// REQ-012 — the Control Tower's utilization view, framed against the
// 65-75% healthy time-utilization band (RESEARCH.md R-002, the same
// source Phase 05's 0.40 idle threshold comes from).

function classify(utilizationRatio) {
  if (utilizationRatio === null) return 'insufficient_data';
  if (utilizationRatio < HEALTHY_MIN) return 'underutilized';
  if (utilizationRatio > HEALTHY_MAX) return 'overutilized';
  return 'healthy';
}

export async function getUtilizationSummary() {
  const rows = await repository.findUsageByEquipmentType();

  const byType = rows.map((row) => {
    const engineHours = Number(row.total_engine_hours);
    const idleHours = Number(row.total_idle_hours);
    const totalHours = engineHours + idleHours;
    const utilizationRatio = totalHours > 0 ? Math.round((engineHours / totalHours) * 1000) / 1000 : null;

    return {
      equipment_type: row.equipment_type,
      engine_hours: engineHours,
      idle_hours: idleHours,
      utilization_ratio: utilizationRatio,
      band: classify(utilizationRatio),
    };
  });

  return { healthy_band: { min: HEALTHY_MIN, max: HEALTHY_MAX }, by_type: byType };
}

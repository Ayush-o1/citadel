import * as repository from './alerts.repository.js';
import { isOverdue, isUpcomingReturn, hasMissingAssignment } from '../../utils/checkoutRules.js';

// REQ-006. No cron job, no separate process: alerts are recomputed from
// live checkout data on every GET and synced into the `alerts` table
// (insert newly-detected conditions, resolve ones that no longer hold).
// Cheap and simple at this data scale (QUALITY.md: don't optimize a
// hypothetical bottleneck) and keeps `alerts` a real, queryable table for
// Phase 07's recommendations to read, per ARCHITECTURE.md's one-way
// analytics dependency — not just an in-memory computation Phase 07 would
// otherwise have to duplicate.
const UPCOMING_RETURN_WINDOW_HOURS = 48;

function detectSignals(checkouts, now) {
  const signals = [];

  for (const c of checkouts) {
    if (isOverdue(c, now)) {
      signals.push({
        checkoutId: c.checkout_id,
        equipmentId: c.equipment_id,
        type: 'overdue',
        severity: 'high',
        message: `${c.equipment_code} is overdue — expected back ${new Date(c.expected_return_at).toISOString()}`,
      });
    } else if (isUpcomingReturn(c, now, UPCOMING_RETURN_WINDOW_HOURS)) {
      signals.push({
        checkoutId: c.checkout_id,
        equipmentId: c.equipment_id,
        type: 'upcoming_return',
        severity: 'low',
        message: `${c.equipment_code} is due back within ${UPCOMING_RETURN_WINDOW_HOURS}h (${new Date(c.expected_return_at).toISOString()})`,
      });
    }

    if (hasMissingAssignment(c)) {
      const missing = [];
      if (!c.operator_id) missing.push('operator');
      if (!c.site_id) missing.push('site');
      signals.push({
        checkoutId: c.checkout_id,
        equipmentId: c.equipment_id,
        type: 'missing_info',
        severity: 'medium',
        message: `${c.equipment_code} is checked out with no ${missing.join(' and no ')} assigned`,
      });
    }
  }

  return signals;
}

async function syncAlerts(signals) {
  const open = await repository.findOpenKeys();
  const openByKey = new Map(open.map((a) => [`${a.checkout_id}:${a.type}`, a]));
  const currentKeys = new Set(signals.map((s) => `${s.checkoutId}:${s.type}`));

  for (const signal of signals) {
    const key = `${signal.checkoutId}:${signal.type}`;
    if (!openByKey.has(key)) {
      await repository.insertAlert(signal);
    }
  }

  for (const [key, alert] of openByKey) {
    if (!currentKeys.has(key)) {
      await repository.resolveAlert(alert.id);
    }
  }
}

export async function syncAndListAlerts() {
  const checkouts = await repository.findActiveCheckoutsWithEquipment();
  const signals = detectSignals(checkouts, new Date());
  await syncAlerts(signals);
  return repository.findAllOpen();
}

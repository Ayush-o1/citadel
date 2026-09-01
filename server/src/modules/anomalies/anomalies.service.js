import * as repository from './anomalies.repository.js';
import { hasMissingAssignment } from '../../utils/checkoutRules.js';

// REQ-007/008. Threshold source: RESEARCH.md R-002, already calibrated
// against the real seeded 17-row dataset in Phase 02 (10 flagged, 7
// clean, no boundary-ambiguous cases — DECISIONS.md's "RISK-003
// calibration result"). Same sync-on-read pattern as Phase 04's alerts —
// see DECISIONS.md's "Phase 04: alerts synced on read" entry, which this
// phase follows rather than re-deciding.
const EXCESSIVE_IDLE_THRESHOLD = 0.4;

function detectSignals(checkouts, usageByCheckout, locationsByCheckout) {
  const signals = [];

  for (const c of checkouts) {
    const usage = usageByCheckout.get(c.checkout_id);

    if (usage) {
      const totalEngine = Number(usage.total_engine_hours);
      const totalIdle = Number(usage.total_idle_hours);
      const totalHours = totalEngine + totalIdle;

      if (totalHours > 0) {
        const idleRatio = totalIdle / totalHours;
        if (idleRatio > EXCESSIVE_IDLE_THRESHOLD) {
          signals.push({
            checkoutId: c.checkout_id,
            equipmentId: c.equipment_id,
            type: 'excessive_idle',
            severity: 'medium',
            reason: `Idle ${Math.round(idleRatio * 100)}% of logged hours over ${usage.log_count} operating day(s)`,
          });
        }
      }

      if (usage.has_zero_runtime_day) {
        signals.push({
          checkoutId: c.checkout_id,
          equipmentId: c.equipment_id,
          type: 'zero_runtime',
          severity: 'high',
          reason:
            totalEngine === 0
              ? `0 engine hours logged across all ${usage.log_count} operating day(s)`
              : `0 engine hours logged on at least one day while checked out`,
        });
      }
    }

    if (hasMissingAssignment(c)) {
      const missing = [];
      if (!c.operator_id) missing.push('operator');
      if (!c.site_id) missing.push('site');
      signals.push({
        checkoutId: c.checkout_id,
        equipmentId: c.equipment_id,
        type: 'missing_assignment',
        severity: 'medium',
        reason: `Checked out with no ${missing.join(' and no ')} assigned`,
      });
    }

    if (c.site_id && c.site_code) {
      // usage_logs.location is a free-text field (e.g. "Site S002 yard"),
      // not the bare site code, so match by substring rather than equality.
      const loggedLocations = locationsByCheckout.get(c.checkout_id) ?? [];
      const mismatch = loggedLocations.find((location) => !location.includes(c.site_code));
      if (mismatch) {
        signals.push({
          checkoutId: c.checkout_id,
          equipmentId: c.equipment_id,
          type: 'unusual_movement',
          severity: 'low',
          reason: `Logged location (${mismatch}) does not match assigned site (${c.site_code})`,
        });
      }
    }
  }

  return signals;
}

async function syncAnomalies(signals) {
  const open = await repository.findOpenKeys();
  const openByKey = new Map(open.map((a) => [`${a.checkout_id}:${a.type}`, a]));
  const currentKeys = new Set(signals.map((s) => `${s.checkoutId}:${s.type}`));

  for (const signal of signals) {
    const key = `${signal.checkoutId}:${signal.type}`;
    if (!openByKey.has(key)) {
      await repository.insertAnomaly(signal);
    }
  }

  for (const [key, anomaly] of openByKey) {
    if (!currentKeys.has(key)) {
      await repository.resolveAnomaly(anomaly.id);
    }
  }
}

export async function syncAndListAnomalies() {
  const [checkouts, usageAggregates, loggedLocations] = await Promise.all([
    repository.findAllCheckoutsWithEquipment(),
    repository.findUsageAggregatesByCheckout(),
    repository.findLoggedLocationsByCheckout(),
  ]);

  const usageByCheckout = new Map(usageAggregates.map((u) => [u.checkout_id, u]));
  const locationsByCheckout = new Map();
  for (const { checkout_id, location } of loggedLocations) {
    if (!locationsByCheckout.has(checkout_id)) locationsByCheckout.set(checkout_id, []);
    locationsByCheckout.get(checkout_id).push(location);
  }

  const signals = detectSignals(checkouts, usageByCheckout, locationsByCheckout);
  await syncAnomalies(signals);
  return repository.findAllOpen();
}

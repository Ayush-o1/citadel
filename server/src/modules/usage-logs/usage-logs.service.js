import * as repository from './usage-logs.repository.js';
import { ApiError } from '../../utils/apiResponse.js';

// REQ-004: a usage log only makes sense against a checkout that's actually
// active — a log against a returned checkout is either stale test data or
// a client bug, and either way must not silently write into an anomaly's
// input data (Phase 05 reads usage_logs directly).
export async function createUsageLog(input) {
  const checkout = await repository.findCheckoutById(input.checkout_id);
  if (!checkout) throw new ApiError(404, 'Checkout not found');
  if (checkout.status !== 'active') {
    throw new ApiError(409, 'Cannot log usage against a checkout that is not active');
  }

  try {
    return await repository.insert({
      checkoutId: input.checkout_id,
      equipmentId: checkout.equipment_id,
      loggedAt: input.logged_at,
      engineHours: input.engine_hours,
      idleHours: input.idle_hours,
      fuelLevel: input.fuel_level,
      location: input.location,
      conditionNote: input.condition_note,
    });
  } catch (err) {
    if (err.code === '23505') {
      throw new ApiError(409, 'A usage log already exists for this checkout on this date');
    }
    throw err;
  }
}

export async function listUsageLogsForCheckout(checkoutId) {
  return repository.findByCheckout(checkoutId);
}

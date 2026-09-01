import { withTransaction } from '../../config/db.js';
import * as repository from './checkouts.repository.js';
import { ApiError } from '../../utils/apiResponse.js';

// REQ-018 + the phase's stated risk: a wrong state transition here corrupts
// every downstream signal (alerts/anomalies/recommendations all read
// checkouts/equipment). Two layers guard against a double check-out:
// an app-level pre-check (fast, friendly 409) and the DB's partial unique
// index idx_checkouts_one_active_per_equipment (the real guarantee under a
// race — caught here as a 23505 and mapped to the same 409).
export async function createCheckout(input) {
  return withTransaction(async (client) => {
    const equipment = await repository.findEquipmentById(client, input.equipment_id);
    if (!equipment) throw new ApiError(404, 'Equipment not found');

    const existingActive = await repository.findActiveByEquipment(client, input.equipment_id);
    if (existingActive) {
      throw new ApiError(409, 'Equipment is already checked out');
    }

    let checkout;
    try {
      checkout = await repository.insertCheckout(client, {
        equipmentId: input.equipment_id,
        operatorId: input.operator_id,
        siteId: input.site_id,
        expectedReturnAt: input.expected_return_at,
        conditionOut: input.condition_out,
        customerName: input.customer_name,
      });
    } catch (err) {
      if (err.code === '23505') throw new ApiError(409, 'Equipment is already checked out');
      if (err.code === '23503') {
        throw new ApiError(400, 'operator_id or site_id does not reference an existing record');
      }
      throw err;
    }

    await repository.markEquipmentCheckedOut(client, input.equipment_id);
    return checkout;
  });
}

export async function checkInCheckout(checkoutId, input) {
  return withTransaction(async (client) => {
    const checkout = await repository.checkIn(client, checkoutId, { conditionIn: input.condition_in });
    if (!checkout) {
      const existing = await repository.findStatusById(client, checkoutId);
      if (!existing) throw new ApiError(404, 'Checkout not found');
      throw new ApiError(409, 'Checkout is already returned');
    }
    await repository.markEquipmentAvailable(client, checkout.equipment_id);
    return checkout;
  });
}

export async function listCheckouts(filters) {
  return repository.findAll(filters);
}

export async function getCheckoutById(id) {
  const checkout = await repository.findById(id);
  if (!checkout) throw new ApiError(404, 'Checkout not found');
  return checkout;
}

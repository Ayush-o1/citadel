import { withTransaction } from '../../config/db.js';
import * as repository from './checkouts.repository.js';
import { ApiError } from '../../utils/apiResponse.js';
import { isOverdue, isUpcomingReturn } from '../../utils/checkoutRules.js';

// Every checkout-listing consumer (Dealer's Asset Dashboard, Customer's My
// Rentals, Admin views) needs the same "is this due soon / overdue"
// answer. Computing it once here, from the same rule functions the alerts
// module already uses, means the frontend never re-derives return-date
// math itself and can't get out of sync with what an actual overdue alert
// would say.
function withUrgency(checkout) {
  return {
    ...checkout,
    is_overdue: isOverdue(checkout),
    is_upcoming_return: isUpcomingReturn(checkout),
  };
}

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
    return withUrgency(checkout);
  });
}

// Not real authentication -- there's no login system (see DECISIONS.md,
// client-simulated roles). But when a request includes customer_name (the
// Customer role's self-return flow always sends it; Dealer/Admin never
// do), the backend genuinely enforces that it matches the checkout's own
// customer_name before allowing the return. Without this, any browser
// tab -- not just a malicious one, just a second person testing the demo
// -- could return someone else's rental by guessing/reusing a checkout
// id. This is name-based ownership, not identity verification; it's
// honest about that limit, not a substitute for real auth.
export async function checkInCheckout(checkoutId, input) {
  return withTransaction(async (client) => {
    const checkout = await repository.checkIn(client, checkoutId, {
      conditionIn: input.condition_in,
      expectedCustomerName: input.customer_name ?? null,
    });
    if (!checkout) {
      const existing = await repository.findStatusById(client, checkoutId);
      if (!existing) throw new ApiError(404, 'Checkout not found');
      if (existing.status !== 'active') throw new ApiError(409, 'Checkout is already returned');
      throw new ApiError(403, 'This rental is not under that customer name');
    }
    await repository.markEquipmentAvailable(client, checkout.equipment_id);
    return withUrgency(checkout);
  });
}

export async function listCheckouts(filters) {
  const rows = await repository.findAll(filters);
  return rows.map(withUrgency);
}

export async function getCheckoutById(id) {
  const checkout = await repository.findById(id);
  if (!checkout) throw new ApiError(404, 'Checkout not found');
  return withUrgency(checkout);
}

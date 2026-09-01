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
export async function createCheckout(input, authUser) {
  // When the request comes from a signed-in Customer, their real Google
  // identity is the source of truth for who this rental belongs to — the
  // client-sent customer_name (if any) is ignored rather than trusted.
  // Dealer/Admin-initiated checkouts, and any unauthenticated request
  // (automated tests, legacy flows), keep the original free-text behavior.
  const isCustomerBooking = authUser?.role === 'customer';
  const customerName = isCustomerBooking ? authUser.name : input.customer_name;
  const userId = isCustomerBooking ? authUser.id : null;

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
        customerName,
        userId,
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

// Ownership on self-return is enforced two ways, chosen per request:
//   - a signed-in Customer's real user_id (real identity, can't be spoofed
//     by typing someone else's name)
//   - the legacy free-text customer_name match, kept for unauthenticated
//     callers (automated tests, and any pre-auth data with no user_id)
// Dealer/Admin check-ins never send either, so they can always check in
// any active rental — that's their job, not a gap.
export async function checkInCheckout(checkoutId, input, authUser) {
  const expectedUserId = authUser?.role === 'customer' ? authUser.id : null;
  const expectedCustomerName = expectedUserId ? null : (input.customer_name ?? null);

  return withTransaction(async (client) => {
    const checkout = await repository.checkIn(client, checkoutId, {
      conditionIn: input.condition_in,
      expectedCustomerName,
      expectedUserId,
    });
    if (!checkout) {
      const existing = await repository.findStatusById(client, checkoutId);
      if (!existing) throw new ApiError(404, 'Checkout not found');
      if (existing.status !== 'active') throw new ApiError(409, 'Checkout is already returned');
      throw new ApiError(403, 'This rental does not belong to you');
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

import { z } from 'zod';

export const createCheckoutSchema = z.object({
  equipment_id: z.string().uuid(),
  operator_id: z.string().uuid().nullish(),
  site_id: z.string().uuid().nullish(),
  expected_return_at: z.string().datetime().nullish(),
  condition_out: z.string().max(200).nullish(),
  // Set by the Customer POV's rental request flow; null for
  // dealer-initiated checkouts. See migration 008.
  customer_name: z.string().min(1).max(120).nullish(),
});

export const checkInSchema = z.object({
  condition_in: z.string().max(200).nullish(),
});

import { z } from 'zod';

export const createUsageLogSchema = z.object({
  checkout_id: z.string().uuid(),
  logged_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'logged_at must be an ISO date (YYYY-MM-DD)'),
  engine_hours: z.number().min(0),
  idle_hours: z.number().min(0),
  fuel_level: z.number().min(0).max(100).nullish(),
  location: z.string().max(200).nullish(),
  condition_note: z.string().max(500).nullish(),
});

import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(200),
  description: z.string().trim().max(2000).optional(),
});

import { z } from 'zod';

export const setRoleSchema = z.object({
  role: z.enum(['customer', 'dealer', 'admin']),
});

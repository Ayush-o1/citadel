import { z } from 'zod';

export const setRoleSchema = z.object({
  role: z.enum(['customer', 'dealer', 'admin']),
});

export const firebaseSignInSchema = z.object({
  idToken: z.string().min(1),
});

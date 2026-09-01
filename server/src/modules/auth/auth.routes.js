import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { setRoleSchema, firebaseSignInSchema } from './auth.schema.js';
import * as controller from './auth.controller.js';

export const authRouter = Router();

authRouter.get('/status', controller.status);
authRouter.post('/firebase', validate(firebaseSignInSchema), asyncHandler(controller.firebaseSignIn));
authRouter.get('/me', controller.me);
authRouter.patch('/me/role', requireAuth, validate(setRoleSchema), asyncHandler(controller.setRole));
authRouter.post('/logout', controller.logout);

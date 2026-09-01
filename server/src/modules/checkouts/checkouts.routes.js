import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuidParam.js';
import { createCheckoutSchema, checkInSchema } from './checkouts.schema.js';
import * as controller from './checkouts.controller.js';

export const checkoutsRouter = Router();

checkoutsRouter.get('/', asyncHandler(controller.list));
checkoutsRouter.get('/:id', validateUuidParam('id'), asyncHandler(controller.getById));
checkoutsRouter.post('/', validate(createCheckoutSchema), asyncHandler(controller.create));
checkoutsRouter.patch(
  '/:id/check-in',
  validateUuidParam('id'),
  validate(checkInSchema),
  asyncHandler(controller.checkIn)
);

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuidParam.js';
import { updateStatusSchema } from './recommendations.schema.js';
import * as controller from './recommendations.controller.js';

export const recommendationsRouter = Router();

recommendationsRouter.get('/', asyncHandler(controller.list));
recommendationsRouter.patch(
  '/:id',
  validateUuidParam('id'),
  validate(updateStatusSchema),
  asyncHandler(controller.updateStatus)
);

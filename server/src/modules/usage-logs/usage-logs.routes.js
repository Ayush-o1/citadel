import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuidParam.js';
import { createUsageLogSchema } from './usage-logs.schema.js';
import * as controller from './usage-logs.controller.js';

export const usageLogsRouter = Router();

usageLogsRouter.post('/', validate(createUsageLogSchema), asyncHandler(controller.create));
usageLogsRouter.get(
  '/checkout/:checkoutId',
  validateUuidParam('checkoutId'),
  asyncHandler(controller.listForCheckout)
);

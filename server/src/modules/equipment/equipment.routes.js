import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateUuidParam } from '../../middleware/validateUuidParam.js';
import * as controller from './equipment.controller.js';

export const equipmentRouter = Router();

equipmentRouter.get('/', asyncHandler(controller.list));
equipmentRouter.get('/:id', validateUuidParam('id'), asyncHandler(controller.getById));

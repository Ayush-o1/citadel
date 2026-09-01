import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as controller from './capacity.controller.js';

export const capacityRouter = Router();

capacityRouter.get('/', asyncHandler(controller.get));

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as controller from './utilization.controller.js';

export const utilizationRouter = Router();

utilizationRouter.get('/', asyncHandler(controller.get));

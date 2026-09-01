import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as controller from './alerts.controller.js';

export const alertsRouter = Router();

alertsRouter.get('/', asyncHandler(controller.list));

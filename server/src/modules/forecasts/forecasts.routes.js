import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as controller from './forecasts.controller.js';

export const forecastsRouter = Router();

forecastsRouter.get('/', asyncHandler(controller.list));

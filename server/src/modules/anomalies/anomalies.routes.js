import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as controller from './anomalies.controller.js';

export const anomaliesRouter = Router();

anomaliesRouter.get('/', asyncHandler(controller.list));

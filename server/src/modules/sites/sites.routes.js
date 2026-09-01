import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as controller from './sites.controller.js';

export const sitesRouter = Router();

sitesRouter.get('/', asyncHandler(controller.list));

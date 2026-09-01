import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as controller from './operators.controller.js';

export const operatorsRouter = Router();

operatorsRouter.get('/', asyncHandler(controller.list));

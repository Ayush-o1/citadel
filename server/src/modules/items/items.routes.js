import { Router } from 'express';
import { itemsController } from './items.controller.js';
import { createItemSchema } from './items.schema.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const itemsRouter = Router();

itemsRouter.get('/', asyncHandler(itemsController.list));
itemsRouter.get('/:id', asyncHandler(itemsController.get));
itemsRouter.post('/', validate(createItemSchema), asyncHandler(itemsController.create));
itemsRouter.delete('/:id', asyncHandler(itemsController.remove));

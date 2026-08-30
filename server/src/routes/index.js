import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { itemsRouter } from '../modules/items/items.routes.js';

// Add new feature modules by mounting them here, one line each.
// Deleting a feature is the same in reverse: remove the module folder + line.
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/items', itemsRouter);

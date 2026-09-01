import { Router } from 'express';
import { healthRouter } from './health.routes.js';

// Add new feature modules by mounting them here, one line each.
// Deleting a feature is the same in reverse: remove the module folder + line.
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);

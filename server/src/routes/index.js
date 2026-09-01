import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { equipmentRouter } from '../modules/equipment/equipment.routes.js';
import { checkoutsRouter } from '../modules/checkouts/checkouts.routes.js';
import { usageLogsRouter } from '../modules/usage-logs/usage-logs.routes.js';
import { alertsRouter } from '../modules/alerts/alerts.routes.js';

// Add new feature modules by mounting them here, one line each.
// Deleting a feature is the same in reverse: remove the module folder + line.
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/equipment', equipmentRouter);
apiRouter.use('/checkouts', checkoutsRouter);
apiRouter.use('/usage-logs', usageLogsRouter);
apiRouter.use('/alerts', alertsRouter);

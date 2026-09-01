import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { equipmentRouter } from '../modules/equipment/equipment.routes.js';
import { checkoutsRouter } from '../modules/checkouts/checkouts.routes.js';
import { usageLogsRouter } from '../modules/usage-logs/usage-logs.routes.js';
import { alertsRouter } from '../modules/alerts/alerts.routes.js';
import { anomaliesRouter } from '../modules/anomalies/anomalies.routes.js';
import { forecastsRouter } from '../modules/forecasts/forecasts.routes.js';
import { recommendationsRouter } from '../modules/recommendations/recommendations.routes.js';
import { sitesRouter } from '../modules/sites/sites.routes.js';
import { operatorsRouter } from '../modules/operators/operators.routes.js';

// Add new feature modules by mounting them here, one line each.
// Deleting a feature is the same in reverse: remove the module folder + line.
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/equipment', equipmentRouter);
apiRouter.use('/checkouts', checkoutsRouter);
apiRouter.use('/usage-logs', usageLogsRouter);
apiRouter.use('/alerts', alertsRouter);
apiRouter.use('/anomalies', anomaliesRouter);
apiRouter.use('/forecasts', forecastsRouter);
apiRouter.use('/recommendations', recommendationsRouter);
apiRouter.use('/sites', sitesRouter);
apiRouter.use('/operators', operatorsRouter);

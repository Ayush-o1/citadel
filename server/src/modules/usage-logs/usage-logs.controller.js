import * as service from './usage-logs.service.js';
import { created, ok } from '../../utils/apiResponse.js';

export async function create(req, res) {
  const usageLog = await service.createUsageLog(req.body);
  created(res, usageLog);
}

export async function listForCheckout(req, res) {
  const logs = await service.listUsageLogsForCheckout(req.params.checkoutId);
  ok(res, logs);
}

import * as service from './alerts.service.js';
import { ok } from '../../utils/apiResponse.js';

export async function list(req, res) {
  const alerts = await service.syncAndListAlerts();
  ok(res, alerts);
}

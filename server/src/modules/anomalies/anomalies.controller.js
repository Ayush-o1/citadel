import * as service from './anomalies.service.js';
import { ok } from '../../utils/apiResponse.js';

export async function list(req, res) {
  const anomalies = await service.syncAndListAnomalies();
  ok(res, anomalies);
}

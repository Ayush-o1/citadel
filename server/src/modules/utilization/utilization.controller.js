import * as service from './utilization.service.js';
import { ok } from '../../utils/apiResponse.js';

export async function get(req, res) {
  const summary = await service.getUtilizationSummary();
  ok(res, summary);
}

import * as service from './capacity.service.js';
import { ok } from '../../utils/apiResponse.js';

export async function get(req, res) {
  const summary = await service.getCapacitySummary();
  ok(res, summary);
}

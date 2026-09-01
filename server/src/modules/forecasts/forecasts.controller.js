import * as service from './forecasts.service.js';
import { ok } from '../../utils/apiResponse.js';

export async function list(req, res) {
  const forecasts = await service.computeAndListForecasts();
  ok(res, forecasts);
}

import * as service from './sites.service.js';
import { ok } from '../../utils/apiResponse.js';

export async function list(req, res) {
  const sites = await service.listSites();
  ok(res, sites);
}

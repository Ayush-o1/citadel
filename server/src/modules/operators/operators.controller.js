import * as service from './operators.service.js';
import { ok } from '../../utils/apiResponse.js';

export async function list(req, res) {
  const operators = await service.listOperators();
  ok(res, operators);
}

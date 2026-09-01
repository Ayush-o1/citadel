import * as service from './equipment.service.js';
import { ok } from '../../utils/apiResponse.js';

export async function list(req, res) {
  const equipment = await service.listEquipment();
  ok(res, equipment);
}

export async function getById(req, res) {
  const equipment = await service.getEquipmentById(req.params.id);
  ok(res, equipment);
}

import { apiRequest } from './client.js';

export function listEquipment() {
  return apiRequest('/equipment');
}

export function getEquipment(id) {
  return apiRequest(`/equipment/${id}`);
}

import { apiRequest } from './client.js';

export function getCapacitySummary() {
  return apiRequest('/capacity');
}

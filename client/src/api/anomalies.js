import { apiRequest } from './client.js';

export function listAnomalies() {
  return apiRequest('/anomalies');
}

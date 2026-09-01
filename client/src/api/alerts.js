import { apiRequest } from './client.js';

export function listAlerts() {
  return apiRequest('/alerts');
}

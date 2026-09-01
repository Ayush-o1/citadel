import { apiRequest } from './client.js';

export function getUtilization() {
  return apiRequest('/utilization');
}

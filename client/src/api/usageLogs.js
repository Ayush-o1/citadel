import { apiRequest } from './client.js';

export function logUsage(payload) {
  return apiRequest('/usage-logs', { method: 'POST', body: JSON.stringify(payload) });
}

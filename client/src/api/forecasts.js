import { apiRequest } from './client.js';

export function listForecasts() {
  return apiRequest('/forecasts');
}

import { apiRequest } from './client.js';

export function listSites() {
  return apiRequest('/sites');
}

export function listOperators() {
  return apiRequest('/operators');
}

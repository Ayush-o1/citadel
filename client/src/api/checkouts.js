import { apiRequest } from './client.js';

export function checkOut(payload) {
  return apiRequest('/checkouts', { method: 'POST', body: JSON.stringify(payload) });
}

export function checkIn(checkoutId, payload = {}) {
  return apiRequest(`/checkouts/${checkoutId}/check-in`, { method: 'PATCH', body: JSON.stringify(payload) });
}

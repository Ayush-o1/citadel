import { apiRequest } from './client.js';

export function listRecommendations() {
  return apiRequest('/recommendations');
}

export function updateRecommendationStatus(id, status) {
  return apiRequest(`/recommendations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

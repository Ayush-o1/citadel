import { apiRequest } from './client.js';

// One small file per backend module — mirrors server/src/modules/*.
export const itemsApi = {
  list: () => apiRequest('/items'),
  create: (data) => apiRequest('/items', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/items/${id}`, { method: 'DELETE' }),
};

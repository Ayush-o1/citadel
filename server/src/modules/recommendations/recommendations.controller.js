import * as service from './recommendations.service.js';
import { ok } from '../../utils/apiResponse.js';

export async function list(req, res) {
  const recommendations = await service.syncAndListRecommendations();
  ok(res, recommendations);
}

export async function updateStatus(req, res) {
  const recommendation = await service.updateRecommendationStatus(req.params.id, req.body.status);
  ok(res, recommendation);
}

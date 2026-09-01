import * as service from './checkouts.service.js';
import { ok, created } from '../../utils/apiResponse.js';

export async function create(req, res) {
  const checkout = await service.createCheckout(req.body, req.user);
  created(res, checkout);
}

export async function checkIn(req, res) {
  const checkout = await service.checkInCheckout(req.params.id, req.body, req.user);
  ok(res, checkout);
}

export async function list(req, res) {
  const checkouts = await service.listCheckouts({
    status: req.query.status,
    customerName: req.query.customer_name,
  });
  ok(res, checkouts);
}

export async function getById(req, res) {
  const checkout = await service.getCheckoutById(req.params.id);
  ok(res, checkout);
}

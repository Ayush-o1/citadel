import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/equipment returns the seeded fleet with computed live status', async () => {
  const res = await request(app).get('/api/equipment');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 17, 'Phase 02 seeded 17 equipment rows');

  const overdue = res.body.data.find((e) => e.code === 'EQX3001');
  assert.ok(overdue, 'EQX3001 fixture should exist from Phase 02 seed');
  assert.equal(overdue.status, 'overdue', 'expected_return_at is in the past for EQX3001');

  const missingAssignment = res.body.data.find((e) => e.code === 'EQX3003');
  assert.ok(missingAssignment.active_checkout, 'EQX3003 should have an active checkout');
  assert.equal(missingAssignment.active_checkout.operator, null);
  assert.equal(missingAssignment.active_checkout.site, null);

  const available = res.body.data.find((e) => e.code === 'EQX1001');
  assert.equal(available.status, 'available', 'EQX1001 is a completed historical checkout');
  assert.equal(available.active_checkout, null);
});

test('GET /api/equipment/:id returns one equipment record', async () => {
  const list = await request(app).get('/api/equipment');
  const target = list.body.data.find((e) => e.code === 'EQX1002');

  const res = await request(app).get(`/api/equipment/${target.id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.code, 'EQX1002');
});

test('GET /api/equipment/:id 404s for a well-formed but nonexistent id', async () => {
  const res = await request(app).get('/api/equipment/00000000-0000-0000-0000-000000000000');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

test('GET /api/equipment/:id 400s for a malformed id', async () => {
  const res = await request(app).get('/api/equipment/not-a-uuid');
  assert.equal(res.status, 400);
});

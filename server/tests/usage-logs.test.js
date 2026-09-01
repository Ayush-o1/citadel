import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { createFixtureEquipment, deleteFixtureEquipment } from './helpers/fixtures.js';

test('usage log requires an active checkout; rejected once the checkout is returned', async () => {
  const equipment = await createFixtureEquipment('UL');

  try {
    const checkoutRes = await request(app).post('/api/checkouts').send({ equipment_id: equipment.id });
    const checkoutId = checkoutRes.body.data.id;

    const logRes = await request(app).post('/api/usage-logs').send({
      checkout_id: checkoutId,
      logged_at: '2026-08-31',
      engine_hours: 6,
      idle_hours: 1,
      location: 'S001',
    });
    assert.equal(logRes.status, 201);
    assert.equal(logRes.body.data.checkout_id, checkoutId);

    const duplicateDay = await request(app).post('/api/usage-logs').send({
      checkout_id: checkoutId,
      logged_at: '2026-08-31',
      engine_hours: 3,
      idle_hours: 0,
    });
    assert.equal(duplicateDay.status, 409, 'one usage log per checkout per day (schema UNIQUE constraint)');

    await request(app).patch(`/api/checkouts/${checkoutId}/check-in`).send({});

    const orphanLog = await request(app).post('/api/usage-logs').send({
      checkout_id: checkoutId,
      logged_at: '2026-09-01',
      engine_hours: 2,
      idle_hours: 1,
    });
    assert.equal(orphanLog.status, 409, 'a usage log against a returned checkout must be rejected');
  } finally {
    await deleteFixtureEquipment(equipment.id);
  }
});

test('usage log against a nonexistent checkout 404s', async () => {
  const res = await request(app).post('/api/usage-logs').send({
    checkout_id: '00000000-0000-0000-0000-000000000000',
    logged_at: '2026-08-31',
    engine_hours: 1,
    idle_hours: 1,
  });
  assert.equal(res.status, 404);
});

test('usage log with a malformed body 400s', async () => {
  const res = await request(app).post('/api/usage-logs').send({
    checkout_id: 'not-a-uuid',
    logged_at: '2026-08-31',
    engine_hours: 1,
    idle_hours: 1,
  });
  assert.equal(res.status, 400);
});

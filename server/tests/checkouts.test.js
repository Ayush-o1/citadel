import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { createFixtureEquipment, deleteFixtureEquipment, pickOperatorId, pickSiteId } from './helpers/fixtures.js';

test('check-out, duplicate check-out rejected, check-in, double check-in rejected', async () => {
  const equipment = await createFixtureEquipment('CO');
  const operatorId = await pickOperatorId();
  const siteId = await pickSiteId();

  try {
    const first = await request(app)
      .post('/api/checkouts')
      .send({ equipment_id: equipment.id, operator_id: operatorId, site_id: siteId });
    assert.equal(first.status, 201);
    assert.equal(first.body.data.status, 'active');

    const equipmentDuringCheckout = await request(app).get(`/api/equipment/${equipment.id}`);
    assert.equal(equipmentDuringCheckout.body.data.status, 'checked_out');

    const duplicate = await request(app)
      .post('/api/checkouts')
      .send({ equipment_id: equipment.id, operator_id: operatorId, site_id: siteId });
    assert.equal(duplicate.status, 409, 'REQ-018: reject a duplicate check-out, not a silent overwrite');

    const checkoutId = first.body.data.id;
    const checkIn = await request(app)
      .patch(`/api/checkouts/${checkoutId}/check-in`)
      .send({ condition_in: 'Good' });
    assert.equal(checkIn.status, 200);
    assert.equal(checkIn.body.data.status, 'returned');

    const doubleCheckIn = await request(app)
      .patch(`/api/checkouts/${checkoutId}/check-in`)
      .send({ condition_in: 'Good' });
    assert.equal(doubleCheckIn.status, 409, 'checking in an already-returned checkout must not succeed silently');

    const equipmentAfter = await request(app).get(`/api/equipment/${equipment.id}`);
    assert.equal(equipmentAfter.body.data.status, 'available');
  } finally {
    await deleteFixtureEquipment(equipment.id);
  }
});

test('check-out against a nonexistent equipment_id 404s', async () => {
  const res = await request(app)
    .post('/api/checkouts')
    .send({ equipment_id: '00000000-0000-0000-0000-000000000000' });
  assert.equal(res.status, 404);
});

test('check-out with a malformed body 400s', async () => {
  const res = await request(app).post('/api/checkouts').send({ equipment_id: 'not-a-uuid' });
  assert.equal(res.status, 400);
});

test('check-in against a nonexistent checkout 404s', async () => {
  const res = await request(app)
    .patch('/api/checkouts/00000000-0000-0000-0000-000000000000/check-in')
    .send({});
  assert.equal(res.status, 404);
});

test('GET /api/checkouts?status=active includes the seeded live checkouts', async () => {
  const res = await request(app).get('/api/checkouts?status=active');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 5, 'Phase 02 seeded 5 active checkouts (EQX3001-EQX3005)');
});

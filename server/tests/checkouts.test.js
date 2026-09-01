import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { signSession, SESSION_COOKIE } from '../src/modules/auth/auth.service.js';
import {
  createFixtureEquipment,
  deleteFixtureEquipment,
  createFixtureUser,
  deleteFixtureUser,
  pickOperatorId,
  pickSiteId,
} from './helpers/fixtures.js';

// Real jwt.sign()/verify() through the same code path a real Google
// sign-in produces, just without the network round-trip to Google — the
// user row itself is real (FK-backed), only the "how did we authenticate"
// step is stubbed.
function sessionCookieFor(user) {
  return `${SESSION_COOKIE}=${signSession(user)}`;
}

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

test('checkout responses include is_overdue/is_upcoming_return computed from the shared checkoutRules', async () => {
  const res = await request(app).get('/api/checkouts?status=active');
  assert.equal(res.status, 200);
  const overdue = res.body.data.find((c) => c.is_overdue === true);
  assert.ok(overdue, 'EQX3001 (seeded overdue) should produce a checkout with is_overdue: true');
  const clean = res.body.data.find((c) => c.is_overdue === false && c.is_upcoming_return === false);
  assert.ok(clean, 'at least one active checkout should be neither overdue nor upcoming-return');
});

test('a customer can only self-return their own named rental, not another customer\'s', async () => {
  const equipment = await createFixtureEquipment('OWN');

  try {
    const rented = await request(app)
      .post('/api/checkouts')
      .send({ equipment_id: equipment.id, customer_name: 'Alice Example' });
    assert.equal(rented.status, 201);
    const checkoutId = rented.body.data.id;

    const wrongCustomer = await request(app)
      .patch(`/api/checkouts/${checkoutId}/check-in`)
      .send({ customer_name: 'Bob Impostor' });
    assert.equal(wrongCustomer.status, 403, 'a different customer name must not be able to self-return this rental');

    const stillActive = await request(app).get(`/api/checkouts/${checkoutId}`);
    assert.equal(stillActive.body.data.status, 'active', 'the rejected attempt must not have changed anything');

    const rightCustomer = await request(app)
      .patch(`/api/checkouts/${checkoutId}/check-in`)
      .send({ customer_name: '  alice example  ' }); // case/whitespace-insensitive match
    assert.equal(rightCustomer.status, 200);
    assert.equal(rightCustomer.body.data.status, 'returned');
  } finally {
    await deleteFixtureEquipment(equipment.id);
  }
});

test('a signed-in customer\'s rental is owned by their real user_id, and another signed-in customer cannot return it', async () => {
  const equipment = await createFixtureEquipment('AUTH');
  const userA = await createFixtureUser('A', { name: 'Alice Auth' });
  const userB = await createFixtureUser('B', { name: 'Bob Auth' });

  try {
    const rented = await request(app)
      .post('/api/checkouts')
      .set('Cookie', sessionCookieFor(userA))
      .send({ equipment_id: equipment.id, customer_name: 'Someone Else Entirely' }); // ignored -- real identity wins
    assert.equal(rented.status, 201);
    assert.equal(rented.body.data.customer_name, 'Alice Auth', 'authenticated identity overrides any client-sent name');
    const checkoutId = rented.body.data.id;

    const wrongUser = await request(app)
      .patch(`/api/checkouts/${checkoutId}/check-in`)
      .set('Cookie', sessionCookieFor(userB))
      .send({});
    assert.equal(wrongUser.status, 403, 'a different signed-in customer must not be able to return this rental');

    const rightUser = await request(app)
      .patch(`/api/checkouts/${checkoutId}/check-in`)
      .set('Cookie', sessionCookieFor(userA))
      .send({});
    assert.equal(rightUser.status, 200);
    assert.equal(rightUser.body.data.status, 'returned');
  } finally {
    await deleteFixtureEquipment(equipment.id);
    await deleteFixtureUser(userA.id);
    await deleteFixtureUser(userB.id);
  }
});

test('a dealer check-in (no customer_name in the request) still works on a customer-named rental', async () => {
  const equipment = await createFixtureEquipment('DLR');

  try {
    const rented = await request(app)
      .post('/api/checkouts')
      .send({ equipment_id: equipment.id, customer_name: 'Alice Example' });
    const checkoutId = rented.body.data.id;

    const dealerCheckIn = await request(app)
      .patch(`/api/checkouts/${checkoutId}/check-in`)
      .send({ condition_in: 'Good' }); // no customer_name -- dealer/admin flow
    assert.equal(dealerCheckIn.status, 200, 'omitting customer_name must not block a dealer-initiated check-in');
  } finally {
    await deleteFixtureEquipment(equipment.id);
  }
});

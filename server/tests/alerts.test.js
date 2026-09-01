import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { createFixtureEquipment, deleteFixtureEquipment } from './helpers/fixtures.js';

test('GET /api/alerts surfaces the seeded overdue, upcoming-return, and missing-info cases', async () => {
  const res = await request(app).get('/api/alerts');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const overdue = res.body.data.find((a) => a.equipment_code === 'EQX3001' && a.type === 'overdue');
  assert.ok(overdue, 'EQX3001 (Phase 02: overdue) should produce an overdue alert');
  assert.equal(overdue.severity, 'high');

  const upcoming = res.body.data.find((a) => a.equipment_code === 'EQX3002' && a.type === 'upcoming_return');
  assert.ok(upcoming, 'EQX3002 (Phase 02: upcoming_return) should produce an upcoming_return alert');

  const missingInfo = res.body.data.find((a) => a.equipment_code === 'EQX3003' && a.type === 'missing_info');
  assert.ok(missingInfo, 'EQX3003 (Phase 02: missing-assignment, active) should produce a missing_info alert');
});

test('a returned checkout produces no alert, and a stale alert resolves once the checkout is returned', async () => {
  const equipment = await createFixtureEquipment('ALERT');

  try {
    const pastReturn = new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(); // 3h ago -> overdue
    const checkoutRes = await request(app)
      .post('/api/checkouts')
      .send({ equipment_id: equipment.id, expected_return_at: pastReturn });
    assert.equal(checkoutRes.status, 201);

    const beforeCheckIn = await request(app).get('/api/alerts');
    assert.ok(
      beforeCheckIn.body.data.some((a) => a.equipment_code === equipment.code && a.type === 'overdue'),
      'the fixture should be flagged overdue while its checkout is still active'
    );

    await request(app).patch(`/api/checkouts/${checkoutRes.body.data.id}/check-in`).send({});

    const afterCheckIn = await request(app).get('/api/alerts');
    assert.ok(
      !afterCheckIn.body.data.some((a) => a.equipment_code === equipment.code),
      'a checked-in checkout must not still show an open alert'
    );
  } finally {
    await deleteFixtureEquipment(equipment.id);
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { createFixtureEquipment, deleteFixtureEquipment } from './helpers/fixtures.js';

test('GET /api/recommendations unifies alerts/anomalies/forecasts into one ranked, worded feed', async () => {
  const res = await request(app).get('/api/recommendations');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length > 0);

  for (const rec of res.body.data) {
    assert.ok(rec.signal, 'every recommendation needs a signal');
    assert.ok(rec.reason, 'every recommendation needs a reason');
    assert.ok(rec.action, 'every recommendation needs an action');
    assert.ok(rec.expected_impact, 'every recommendation needs an expected impact');
    assert.match(rec.expected_impact, /^Simulated:/, 'REQ-016: impact must be labeled as simulated, not a bare claim');
  }

  // REQ-006/007 -> REQ-010: the seeded EQX3001 overdue alert and the
  // EQX1002/EQX1007 anomalies must all surface as recommendations.
  assert.ok(res.body.data.some((r) => r.source_type === 'alert' && r.equipment_code === 'EQX3001'));
  assert.ok(res.body.data.some((r) => r.source_type === 'anomaly' && r.equipment_code === 'EQX1002'));

  // REQ-009 -> REQ-010: the Excavator/S003 upward forecast must surface too.
  const forecastRec = res.body.data.find((r) => r.source_type === 'forecast');
  assert.ok(forecastRec, 'the trending-up Excavator/S003 forecast should produce a recommendation');
  assert.equal(forecastRec.action, 'extend');

  // Ranking: forecast-sourced items must rank after every alert/anomaly item.
  const lastNonForecastIndex = res.body.data.reduce(
    (acc, r, i) => (r.source_type !== 'forecast' ? i : acc),
    -1
  );
  const firstForecastIndex = res.body.data.findIndex((r) => r.source_type === 'forecast');
  assert.ok(
    firstForecastIndex === -1 || firstForecastIndex > lastNonForecastIndex,
    'forecast-driven suggestions must rank below every alert/anomaly item'
  );
});

test('GET /api/recommendations is idempotent — re-syncing does not duplicate rows', async () => {
  const first = await request(app).get('/api/recommendations');
  const second = await request(app).get('/api/recommendations');
  assert.equal(first.body.data.length, second.body.data.length);
  assert.deepEqual(
    first.body.data.map((r) => r.id).sort(),
    second.body.data.map((r) => r.id).sort()
  );
});

test('marking a recommendation actioned persists, excludes it from the active queue, and rejects a second action', async () => {
  // A disposable fixture, not a seeded row: mutating a real seeded
  // recommendation's status here would permanently alter demo state for
  // later manual testing and future test runs (its own resurrection is
  // deliberately blocked by the insert-once sync rule).
  const equipment = await createFixtureEquipment('REC');

  try {
    const pastReturn = new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString();
    await request(app).post('/api/checkouts').send({ equipment_id: equipment.id, expected_return_at: pastReturn });

    const before = await request(app).get('/api/recommendations');
    const target = before.body.data.find((r) => r.equipment_code === equipment.code);
    assert.ok(target, 'the fixture overdue checkout should have produced a recommendation');

    const patched = await request(app).patch(`/api/recommendations/${target.id}`).send({ status: 'actioned' });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.data.status, 'actioned');
    assert.ok(patched.body.data.actioned_at);

    const after = await request(app).get('/api/recommendations');
    assert.ok(
      !after.body.data.some((r) => r.id === target.id),
      'an actioned recommendation must not reappear in the active queue'
    );

    const doubleAction = await request(app).patch(`/api/recommendations/${target.id}`).send({ status: 'dismissed' });
    assert.equal(
      doubleAction.status,
      409,
      'a recommendation that is no longer pending must reject a second status change'
    );
  } finally {
    await deleteFixtureEquipment(equipment.id);
  }
});

test('PATCH with a malformed body 400s; PATCH against a nonexistent id 404s', async () => {
  const list = await request(app).get('/api/recommendations');
  const anyId = list.body.data[0]?.id ?? '00000000-0000-0000-0000-000000000000';

  const badBody = await request(app).patch(`/api/recommendations/${anyId}`).send({ status: 'not-a-status' });
  assert.equal(badBody.status, 400);

  const notFound = await request(app)
    .patch('/api/recommendations/00000000-0000-0000-0000-000000000000')
    .send({ status: 'dismissed' });
  assert.equal(notFound.status, 404);
});

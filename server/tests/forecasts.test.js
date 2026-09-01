import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/forecasts produces a real forecast where history supports it, and an honest fallback where it does not', async () => {
  const res = await request(app).get('/api/forecasts');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const find = (type, siteCode) =>
    res.body.data.find((f) => f.equipment_type === type && f.site.code === siteCode);

  // Phase 02 deliberately seeded Excavator/S003 and Bulldozer/S002 with
  // enough trailing checkout volume to support a real forecast.
  for (const [type, site] of [
    ['Excavator', 'S003'],
    ['Bulldozer', 'S002'],
  ]) {
    const forecast = find(type, site);
    assert.ok(forecast, `${type}/${site} should appear in the forecast list`);
    assert.equal(forecast.insufficient_history, false);
    assert.ok(typeof forecast.predicted_demand === 'number' && forecast.predicted_demand > 0);
    assert.ok(forecast.factors && forecast.factors.length > 0, 'REQ-009: factors must be stated');
    assert.ok(forecast.method && forecast.method.length > 0);
  }

  // Phase 02 deliberately seeded Grader/S001 sparse, specifically to
  // exercise this fallback (REQ-019: never fabricate a number).
  const grader = find('Grader', 'S001');
  assert.ok(grader, 'Grader/S001 should appear in the forecast list');
  assert.equal(grader.insufficient_history, true);
  assert.equal(grader.predicted_demand, undefined, 'an insufficient-history entry must not carry a fabricated number');
  assert.ok(grader.note && grader.note.length > 0);
});

test('a real forecast has a well-formed upcoming period', async () => {
  const res = await request(app).get('/api/forecasts');
  const real = res.body.data.find((f) => f.insufficient_history === false);
  assert.ok(real, 'at least one real forecast must exist');
  assert.match(real.period_start, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(real.period_end, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(real.period_end) > new Date(real.period_start));
});

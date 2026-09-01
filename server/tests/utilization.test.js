import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/utilization frames each equipment type against the 65-75% healthy band', async () => {
  const res = await request(app).get('/api/utilization');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.healthy_band.min, 0.65);
  assert.equal(res.body.data.healthy_band.max, 0.75);

  const byType = res.body.data.by_type;
  assert.ok(byType.length > 0);

  // Bulldozer's seeded checkouts (EQX1003/1005 well-utilized, EQX2003
  // mixed) should average out to a real, non-null utilization ratio.
  const bulldozer = byType.find((t) => t.equipment_type === 'Bulldozer');
  assert.ok(bulldozer);
  assert.ok(typeof bulldozer.utilization_ratio === 'number');
  assert.ok(['underutilized', 'healthy', 'overutilized'].includes(bulldozer.band));
});

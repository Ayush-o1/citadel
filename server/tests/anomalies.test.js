import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/anomalies flags the official worked examples exactly as Caterpillar\'s sample intends', async () => {
  const res = await request(app).get('/api/anomalies');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const byCode = (code) => res.body.data.filter((a) => a.equipment_code === code);

  // EQX1002 / EQX1007: the official sample's own worked anomaly example —
  // 0 engine hours/day and NULL site/operator (Phase 05 spec + DECISIONS.md).
  for (const code of ['EQX1002', 'EQX1007']) {
    const anomalies = byCode(code);
    assert.ok(anomalies.some((a) => a.type === 'zero_runtime'), `${code} should be flagged zero_runtime`);
    assert.ok(
      anomalies.some((a) => a.type === 'missing_assignment'),
      `${code} should be flagged missing_assignment`
    );
    for (const a of anomalies) {
      assert.ok(a.reason && a.reason.length > 0, 'every anomaly must have a human-readable reason');
    }
  }

  // EQX1003 / EQX1005: the best-utilized official rows — must NOT be flagged at all.
  for (const code of ['EQX1003', 'EQX1005']) {
    assert.equal(byCode(code).length, 0, `${code} is well-utilized and must not be flagged`);
  }

  // EQX1001 / EQX1004 / EQX1006: idle ratios of 0.87 / 0.82 / 0.67 — all exceed the 0.40 threshold.
  for (const code of ['EQX1001', 'EQX1004', 'EQX1006']) {
    assert.ok(
      byCode(code).some((a) => a.type === 'excessive_idle'),
      `${code} exceeds the 0.40 idle-ratio threshold and should be flagged excessive_idle`
    );
  }

  // EQX3004: Phase 02's deliberately-seeded unusual-movement case.
  const unusualMovement = byCode('EQX3004').find((a) => a.type === 'unusual_movement');
  assert.ok(unusualMovement, 'EQX3004 should be flagged unusual_movement');
  assert.match(unusualMovement.reason, /does not match assigned site/);

  // EQX3005: Phase 02's deliberate healthy baseline — no anomalies at all.
  assert.equal(byCode('EQX3005').length, 0, 'EQX3005 is a clean baseline and must not be flagged');
});

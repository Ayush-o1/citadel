import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/capacity flags EQX3006 as underutilized against the Excavator baseline, with visible assumptions', async () => {
  const res = await request(app).get('/api/capacity');
  assert.equal(res.status, 200);

  const { active_checkouts: activeCheckouts, type_baselines: typeBaselines } = res.body.data;
  assert.ok(Array.isArray(activeCheckouts));
  assert.ok(Array.isArray(typeBaselines));

  // Layer 3 seeded three healthy-band Excavator rentals — enough for a
  // trusted baseline (capacity.service.js's MIN_BASELINE_SAMPLES = 3).
  const excavatorBaseline = typeBaselines.find((b) => b.equipment_type === 'Excavator');
  assert.ok(excavatorBaseline, 'expected an Excavator type_baseline entry');
  assert.ok(excavatorBaseline.sample_count >= 3);
  assert.ok(excavatorBaseline.typical_total_hours > 0);
  assert.equal(excavatorBaseline.assumed_capacity_hours, 8);

  // EQX3006: 5 logged days averaging 4h/day against an 8h/day assumed
  // capacity (50%, under the 65% floor) with a ~55-day remaining rental
  // window — long enough that the estimated completion range sits well
  // inside it, so this must be flagged as underutilized_capacity.
  const eqx3006 = activeCheckouts.find((s) => s.equipment_code === 'EQX3006');
  assert.ok(eqx3006, 'expected EQX3006 in the capacity summary');
  assert.equal(eqx3006.insufficient_history, false);
  assert.equal(eqx3006.underutilized_capacity, true);
  assert.ok(eqx3006.estimated_completion_days_low > 0);
  assert.ok(eqx3006.estimated_completion_days_high >= eqx3006.estimated_completion_days_low);
  assert.ok(Array.isArray(eqx3006.assumptions) && eqx3006.assumptions.length >= 2);
  assert.ok(eqx3006.assumptions[0].includes('Assumed capacity'));
});

test('GET /api/recommendations includes a capacity-sourced recommendation for EQX3006', async () => {
  const res = await request(app).get('/api/recommendations');
  assert.equal(res.status, 200);

  const capacityRec = res.body.data.find((r) => r.source_type === 'capacity' && r.signal.startsWith('EQX3006'));
  assert.ok(capacityRec, 'expected a capacity recommendation for EQX3006');
  assert.equal(capacityRec.action, 'investigate');
  assert.match(capacityRec.expected_impact, /^Simulated:/);
});

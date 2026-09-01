import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

// Minimal read-only reference data the Asset Dashboard's check-out form
// needs to populate operator/site pickers (Phase 08) — added here rather
// than as a separate phase since it's a small, obvious gap Phase 03
// didn't need until a real UI called for it.
test('GET /api/sites returns the seeded sites', async () => {
  const res = await request(app).get('/api/sites');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 6, 'Phase 02 seeded 6 sites');
  assert.ok(res.body.data.every((s) => s.code));
});

test('GET /api/operators returns the seeded operators', async () => {
  const res = await request(app).get('/api/operators');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 13, 'Phase 02 seeded 13 operators');
  assert.ok(res.body.data.every((o) => o.code));
});

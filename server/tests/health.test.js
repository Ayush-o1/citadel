import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/health responds with 200 and status ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'ok');
});

test('GET /api/unknown-route responds with 404', async () => {
  const res = await request(app).get('/api/unknown-route');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

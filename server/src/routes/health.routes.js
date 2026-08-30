import { Router } from 'express';
import { checkConnection } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    let database = 'unreachable';
    try {
      await checkConnection();
      database = 'connected';
    } catch {
      database = 'unreachable';
    }

    ok(res, {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database,
    });
  })
);

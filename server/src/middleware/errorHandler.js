import { isProduction } from '../config/env.js';
import { ApiError } from '../utils/apiResponse.js';

// Centralized error handler. Every route funnels errors here via
// asyncHandler or next(err) instead of handling them inline.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err instanceof ApiError ? err.status : err.status || 500;
  const message = status === 500 && isProduction ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

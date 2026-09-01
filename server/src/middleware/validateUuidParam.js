import { ApiError } from '../utils/apiResponse.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rejects a malformed :id path param with 400 before it reaches a query —
// without this, Postgres throws "invalid input syntax for type uuid" (code
// 22P02), which the generic error handler would otherwise surface as a 500.
export function validateUuidParam(paramName) {
  return (req, res, next) => {
    if (!UUID_RE.test(req.params[paramName])) {
      throw new ApiError(400, `Invalid ${paramName}: must be a UUID`);
    }
    next();
  };
}

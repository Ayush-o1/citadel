import { SESSION_COOKIE, verifySession } from '../modules/auth/auth.service.js';
import { ApiError } from '../utils/apiResponse.js';

// Mounted globally: every request gets req.user populated (or null) from
// its session cookie, without requiring sign-in. Individual routes opt
// into requireAuth when they actually need a signed-in user.
export function attachUser(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  req.user = token ? verifySession(token) : null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) throw new ApiError(401, 'Sign in required');
  next();
}

import { isProduction } from '../../config/env.js';
import { ok } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiResponse.js';
import * as service from './auth.service.js';
import * as repository from './auth.repository.js';

// SameSite=Lax cookies are never sent on a cross-site fetch/XHR request —
// only on a top-level navigation. Locally, Vercel-would-be (client) and
// Render-would-be (API) are both `localhost`, so they're same-site and
// Lax works. In the real hosted deployment they're genuinely different
// domains (e.g. citadel.vercel.app calling citadel-api.onrender.com) —
// cross-site, so this must stay conditional on isProduction, not
// hardcoded either way (SameSite=None requires Secure, which requires
// HTTPS — true for both Vercel and Render, never true for local HTTP dev).
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function toPublicUser(user) {
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, role: user.role };
}

export function status(req, res) {
  ok(res, { googleConfigured: service.isFirebaseConfigured() });
}

// Called by the SPA via fetch() (credentials: 'include') after
// signInWithPopup(GoogleAuthProvider) succeeds client-side — not a
// server-side redirect flow. Returns JSON like every other endpoint,
// since there's no top-level navigation involved here to redirect from.
export async function firebaseSignIn(req, res) {
  const user = await service.completeFirebaseSignIn(req.body.idToken);

  try {
    const token = service.signSession(user);
    res.cookie(service.SESSION_COOKIE, token, COOKIE_OPTIONS);
  } catch (err) {
    console.error('Google sign-in [stage: session creation] — real cause:', err);
    throw new ApiError(502, 'Signed in with Google, but could not create your session');
  }

  ok(res, toPublicUser(user));
}

export function me(req, res) {
  ok(res, toPublicUser(req.user));
}

export async function setRole(req, res) {
  const updated = await repository.updateRole(req.user.id, req.body.role);
  const token = service.signSession(updated);
  res.cookie(service.SESSION_COOKIE, token, COOKIE_OPTIONS);
  ok(res, toPublicUser(updated));
}

export function logout(req, res) {
  // Must match COOKIE_OPTIONS' httpOnly/secure/sameSite exactly — a
  // browser only clears a cookie when the clearing call's attributes
  // match the ones it was set with, otherwise this silently no-ops and
  // "sign out" leaves the session cookie in place.
  res.clearCookie(service.SESSION_COOKIE, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
  ok(res, { signedOut: true });
}

import crypto from 'node:crypto';
import { env, isProduction } from '../../config/env.js';
import { ok } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiResponse.js';
import * as service from './auth.service.js';
import * as repository from './auth.repository.js';

// SameSite=Lax cookies are never sent on a cross-site fetch/XHR request —
// only on a top-level navigation. Locally, Vercel-would-be (client) and
// Render-would-be (API) are both `localhost`, so they're same-site and
// Lax works. In the real hosted deployment they're genuinely different
// domains (e.g. citadel.vercel.app calling citadel-api.onrender.com) —
// cross-site. Without this, the Google OAuth redirect (a real top-level
// navigation) would still set the cookie fine, but every subsequent
// `fetch(..., {credentials:'include'})` call from the SPA would silently
// drop it, making the app look permanently signed-out right after a
// successful sign-in. SameSite=None requires Secure, which requires
// HTTPS — true for both Vercel and Render, never true for local HTTP dev,
// so this must stay conditional on isProduction, not hardcoded either way.
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
  ok(res, { googleConfigured: service.isGoogleConfigured() });
}

export function googleStart(req, res) {
  const state = crypto.randomBytes(16).toString('hex');
  const url = service.buildGoogleAuthUrl(state);
  res.redirect(url);
}

export async function googleCallback(req, res) {
  const { code, error } = req.query;
  if (error) {
    return res.redirect(`${env.clientOrigin}/auth/error?reason=${encodeURIComponent(String(error))}`);
  }
  if (!code) throw new ApiError(400, 'Missing authorization code from Google');

  const user = await service.completeGoogleSignIn(String(code));
  const token = service.signSession(user);
  res.cookie(service.SESSION_COOKIE, token, COOKIE_OPTIONS);
  res.redirect(`${env.clientOrigin}/auth/complete`);
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

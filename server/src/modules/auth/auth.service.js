import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiResponse.js';
import * as repository from './auth.repository.js';

// Falls back to a random secret generated once at process start rather than
// a hardcoded default, so a missing SESSION_SECRET can never sign a
// predictable token — the tradeoff (documented, acceptable for a hackathon
// demo) is that every server restart invalidates existing sessions.
const sessionSecret = env.sessionSecret || crypto.randomBytes(32).toString('hex');
const SESSION_TTL = '7d';
export const SESSION_COOKIE = 'citadel_session';

export function isGoogleConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret);
}

// Manual Authorization Code flow (no passport/google-auth-library) — three
// plain HTTPS calls to Google's own endpoints. Kept dependency-free since
// this is the entire footprint of "real auth" this app needs.
export function buildGoogleAuthUrl(state) {
  if (!isGoogleConfigured()) {
    throw new ApiError(503, 'Google sign-in is not configured on this server yet (missing GOOGLE_CLIENT_ID/SECRET)');
  }
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Every stage below is wrapped so a failure produces a distinct,
// diagnosable ApiError (never status 500, so errorHandler's production
// masking never swallows it into a generic "Internal server error") —
// the real underlying error (network failure, a bad Google response, a
// database error) is logged server-side with a stage label, never sent
// to the client, but the client-visible message alone is now enough to
// tell which stage failed without needing server log access at all.
export async function completeGoogleSignIn(code) {
  let tokenRes;
  try {
    tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        redirect_uri: env.googleRedirectUri,
        grant_type: 'authorization_code',
      }),
    });
  } catch (err) {
    console.error('Google sign-in [stage: token request] — could not reach Google at all:', err);
    throw new ApiError(502, 'Google sign-in failed: could not reach Google to exchange the authorization code');
  }
  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => '<unreadable body>');
    console.error(`Google sign-in [stage: token exchange] — Google responded ${tokenRes.status}:`, body);
    throw new ApiError(502, 'Google sign-in failed while exchanging the authorization code');
  }
  let tokens;
  try {
    tokens = await tokenRes.json();
  } catch (err) {
    console.error('Google sign-in [stage: token parse] — token response was not valid JSON:', err);
    throw new ApiError(502, 'Google sign-in failed: unexpected response while exchanging the authorization code');
  }

  let profileRes;
  try {
    profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
  } catch (err) {
    console.error('Google sign-in [stage: profile request] — could not reach Google at all:', err);
    throw new ApiError(502, 'Google sign-in failed: could not reach Google to fetch your profile');
  }
  if (!profileRes.ok) {
    const body = await profileRes.text().catch(() => '<unreadable body>');
    console.error(`Google sign-in [stage: profile fetch] — Google responded ${profileRes.status}:`, body);
    throw new ApiError(502, 'Google sign-in failed while fetching your profile');
  }
  let profile;
  try {
    profile = await profileRes.json();
  } catch (err) {
    console.error('Google sign-in [stage: profile parse] — profile response was not valid JSON:', err);
    throw new ApiError(502, 'Google sign-in failed: unexpected response while fetching your profile');
  }

  let user;
  try {
    user = await repository.findByGoogleId(profile.sub);
    if (!user) {
      user = await repository.createUser({
        googleId: profile.sub,
        email: profile.email,
        name: profile.name || profile.email,
        avatarUrl: profile.picture,
      });
    } else {
      await repository.touchLogin(user.id);
      if (user.name !== profile.name || user.avatar_url !== profile.picture) {
        user = await repository.updateProfile(user.id, {
          name: profile.name || user.name,
          avatarUrl: profile.picture,
        });
      }
    }
  } catch (err) {
    console.error('Google sign-in [stage: database lookup/create] — real cause:', err);
    throw new ApiError(502, 'Google sign-in failed while saving your account (a database error on the server)');
  }
  return user;
}

export function signSession(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url, role: user.role },
    sessionSecret,
    { expiresIn: SESSION_TTL }
  );
}

export function verifySession(token) {
  try {
    return jwt.verify(token, sessionSecret);
  } catch {
    return null;
  }
}

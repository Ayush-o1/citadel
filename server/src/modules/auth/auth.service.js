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

export async function completeGoogleSignIn(code) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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
  if (!tokenRes.ok) {
    throw new ApiError(502, 'Google sign-in failed while exchanging the authorization code');
  }
  const tokens = await tokenRes.json();

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    throw new ApiError(502, 'Google sign-in failed while fetching your profile');
  }
  const profile = await profileRes.json();

  let user = await repository.findByGoogleId(profile.sub);
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

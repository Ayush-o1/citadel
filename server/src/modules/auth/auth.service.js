import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { isFirebaseConfigured, verifyFirebaseIdToken } from '../../config/firebaseAdmin.js';
import { ApiError } from '../../utils/apiResponse.js';
import * as repository from './auth.repository.js';

// Falls back to a random secret generated once at process start rather than
// a hardcoded default, so a missing SESSION_SECRET can never sign a
// predictable token — the tradeoff (documented, acceptable for a hackathon
// demo) is that every server restart invalidates existing sessions.
const sessionSecret = env.sessionSecret || crypto.randomBytes(32).toString('hex');
const SESSION_TTL = '7d';
export const SESSION_COOKIE = 'citadel_session';

export { isFirebaseConfigured };

// Replaces the old manual Authorization Code flow (buildGoogleAuthUrl +
// a 3-call token/profile exchange against Google's own endpoints) with
// Firebase Authentication: the client SDK's signInWithPopup(GoogleAuthProvider)
// handles the entire OAuth dance itself and hands back a Firebase ID
// token, which this verifies server-side via the Admin SDK. This isn't
// just a swap for its own sake — it eliminates the whole bug class this
// session spent hours on: no server-side redirect URI to get wrong, no
// manual token exchange that can fail on a network hiccup, and no
// top-level-navigation-with-no-feedback that produces double-fires (the
// race condition fixed in the previous commit). Sign-in is now a single
// POST from the SPA, same as every other API call.
//
// Deliberately untouched: the `users` table, upsertGoogleUser's schema
// and logic, role handling, and signSession/verifySession below — the
// only thing that changed is how identity gets verified, not how it's
// stored (per explicit instruction: don't change anything in the
// database).
export async function completeFirebaseSignIn(idToken) {
  if (!isFirebaseConfigured()) {
    throw new ApiError(503, 'Google sign-in is not configured on this server yet (missing FIREBASE_SERVICE_ACCOUNT_JSON)');
  }

  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(idToken);
  } catch (err) {
    console.error('Google sign-in [stage: firebase token verification] — real cause:', err);
    throw new ApiError(401, 'Google sign-in failed: your sign-in could not be verified (the token may have expired — please try again)');
  }

  // The stable Google account identifier — the same value the old
  // manual-OAuth flow stored in users.google_id (Google's userinfo `sub`
  // and Firebase's recorded Google-provider identity are the same
  // underlying Google account ID), so existing rows still match correctly
  // with no data migration. Falls back to decoded.uid only in the
  // never-expected case a Google-provider identity is somehow absent from
  // a token that came from Google sign-in.
  const googleId = decoded.firebase?.identities?.['google.com']?.[0] || decoded.uid;
  if (!decoded.email) {
    throw new ApiError(400, 'Google sign-in failed: no email was returned for this account');
  }

  let user;
  try {
    // Same atomic upsert as before (auth.repository.js) — no separate
    // find-then-branch, so there is no window for concurrent requests to
    // race each other into a unique-constraint failure.
    user = await repository.upsertGoogleUser({
      googleId,
      email: decoded.email,
      name: decoded.name || decoded.email,
      avatarUrl: decoded.picture,
    });
  } catch (err) {
    console.error('Google sign-in [stage: database upsert] — real cause:', err);
    const pgInfo = err.code ? ` [pg:${err.code}${err.constraint ? ` on ${err.constraint}` : ''}${err.table ? ` in ${err.table}` : ''}]` : '';
    throw new ApiError(502, `Google sign-in failed while saving your account (a database error on the server)${pgInfo}`);
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

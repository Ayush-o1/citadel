import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';

// Lazily initialized so a missing FIREBASE_SERVICE_ACCOUNT_JSON doesn't
// crash the whole server at import time — mirrors the old
// isGoogleConfigured() pattern (this app runs fine without auth
// configured; only sign-in itself is unavailable until it's set).
let app = null;

export function isFirebaseConfigured() {
  return Boolean(env.firebaseServiceAccountJson);
}

function getApp() {
  if (app) return app;
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set');
  }
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(env.firebaseServiceAccountJson);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON — paste the full downloaded service account file contents');
  }
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

// Verifies a Firebase ID token from the client SDK's signInWithPopup
// result and returns its decoded claims. Throws on an invalid/expired
// token — the caller (auth.service.js) turns that into a safe,
// stage-labeled ApiError, same pattern as the rest of this module.
export async function verifyFirebaseIdToken(idToken) {
  return getAuth(getApp()).verifyIdToken(idToken);
}

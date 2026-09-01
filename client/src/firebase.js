import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guarded so a missing/incomplete Firebase config doesn't crash the
// whole app at import time (e.g. before VITE_FIREBASE_* is set on
// Vercel) — mirrors the server's isFirebaseConfigured() pattern. Only
// the sign-in button becomes unavailable, same as before.
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

export const auth = firebaseConfigured ? getAuth(initializeApp(firebaseConfig)) : null;
export const googleProvider = new GoogleAuthProvider();

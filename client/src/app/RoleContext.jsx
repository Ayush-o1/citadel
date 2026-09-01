import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth';
import { API_ORIGIN } from '../api/client.js';
import { auth, googleProvider, firebaseConfigured } from '../firebase.js';

// signInWithPopup fails on a real, non-trivial slice of devices: Safari
// (especially iOS) and many mobile browsers either block the popup
// outright (auth/popup-blocked) or don't support it at all
// (auth/operation-not-supported-in-this-environment — common in
// in-app browsers like Instagram/Facebook's webview). Falling back to
// signInWithRedirect (a full-page navigation to Google, then back) is
// Firebase's own documented answer to this — not a bug workaround,
// this is the expected, necessary pattern for cross-device reliability.
const POPUP_FALLBACK_CODES = new Set(['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment']);

// Same origin as every other API call (see client.js).
const API_BASE = `${API_ORIGIN}/api`;

export const ROLES = {
  CUSTOMER: 'customer',
  DEALER: 'dealer',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.CUSTOMER]: 'Customer',
  [ROLES.DEALER]: 'Dealer',
  [ROLES.ADMIN]: 'Caterpillar Admin',
};

const RoleContext = createContext(null);

// Real identity, real session. `user` is undefined while the initial
// /api/auth/me check is in flight, null once we know there's no session,
// or the signed-in user's real Google-backed record otherwise. Role is
// stored server-side on that user (nullable until first chosen) — see
// server/src/modules/auth and migration 010_create_users.sql.
export function RoleProvider({ children }) {
  const [user, setUser] = useState(undefined);
  // Surfaces a failure completing a *redirect*-based sign-in, which
  // happens after a full page reload — by the time it's known, whatever
  // component triggered the original click is long gone, so this can't
  // just be thrown back to a local catch the way the popup path's error
  // can. Entry.jsx displays this alongside its own local error state.
  const [pendingRedirectError, setPendingRedirectError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      const body = await res.json();
      setUser(body.data ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Completes sign-in with a Firebase ID token against the backend,
  // shared by both the popup and redirect paths below so they can never
  // drift out of sync with each other.
  const finishSignIn = useCallback(async (idToken) => {
    const res = await fetch(`${API_BASE}/auth/firebase`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message || 'Could not sign in');
    setUser(body.data);
    return body.data;
  }, []);

  // On mount, check whether we're returning from a signInWithRedirect
  // round trip (Google -> back to this page). A no-op on every normal
  // page load (getRedirectResult resolves to null when there's nothing
  // pending) — cheap enough to always check rather than trying to detect
  // "did we just redirect" some other way.
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;
        const idToken = await result.user.getIdToken();
        await finishSignIn(idToken);
      })
      .catch((err) => setPendingRedirectError(err.message || 'Could not complete sign-in'));
  }, [finishSignIn]);

  // Firebase's client SDK handles the entire Google OAuth flow itself
  // (no server-side redirect URI to configure or get wrong); this only
  // needs the resulting ID token, verified server-side in
  // auth.service.js's completeFirebaseSignIn. Tries the popup first
  // (better UX: no full navigation away from the app) and falls back to
  // a redirect on the devices/browsers where popups don't work — see
  // POPUP_FALLBACK_CODES above. Throws on a real failure (server
  // rejected the token, network error, or the user closed the popup) so
  // the caller (Entry.jsx) can show it inline; a redirect in progress
  // never returns here at all (the page navigates away), so its result
  // is handled by the effect above instead.
  const signIn = useCallback(async () => {
    if (!firebaseConfigured) {
      throw new Error('Sign-in is unavailable: this deployment is missing its Firebase configuration (VITE_FIREBASE_*).');
    }
    setPendingRedirectError(null);
    let result;
    try {
      result = await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (POPUP_FALLBACK_CODES.has(err.code)) {
        await signInWithRedirect(auth, googleProvider);
        return; // page is navigating away — nothing left to do here
      }
      throw err;
    }
    const idToken = await result.user.getIdToken();
    await finishSignIn(idToken);
  }, [finishSignIn]);

  const signOut = useCallback(async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    // Best-effort: also sign the Firebase client SDK out of the Google
    // session it's tracking, so a later signInWithPopup doesn't silently
    // reuse a stale client-side session. Never blocks sign-out on this.
    if (auth) await firebaseSignOut(auth).catch(() => {});
    setUser(null);
  }, []);

  const setRole = useCallback(async (role) => {
    const res = await fetch(`${API_BASE}/auth/me/role`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message || 'Could not update role');
    setUser(body.data);
    return body.data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading: user === undefined,
      role: user?.role ?? null,
      customerName: user?.name ?? '',
      signIn,
      signOut,
      setRole,
      refresh,
      pendingRedirectError,
    }),
    [user, signIn, signOut, setRole, refresh, pendingRedirectError]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { API_ORIGIN } from '../api/client.js';
import { auth, googleProvider, firebaseConfigured } from '../firebase.js';

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

  // Firebase's client SDK handles the entire Google OAuth popup flow
  // itself (no server-side redirect URI to configure or get wrong); this
  // only needs the resulting ID token, verified server-side in
  // auth.service.js's completeFirebaseSignIn. Throws on failure (popup
  // closed, network error, server rejected the token) so the caller
  // (Entry.jsx) can show it inline, same pattern as role selection below.
  const signIn = useCallback(async () => {
    if (!firebaseConfigured) {
      throw new Error('Sign-in is unavailable: this deployment is missing its Firebase configuration (VITE_FIREBASE_*).');
    }
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    const res = await fetch(`${API_BASE}/auth/firebase`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message || 'Could not sign in');
    setUser(body.data);
  }, []);

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
    }),
    [user, signIn, signOut, setRole, refresh]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

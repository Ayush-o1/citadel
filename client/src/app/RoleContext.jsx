import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_ORIGIN } from '../api/client.js';

// Same origin as every other API call (see client.js) — Google sign-in
// is a full navigation, not a fetch(), so it's easy for this to drift
// out of sync with the rest of the app if it isn't sourced from the
// same place. It now is, on purpose.
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

  const signIn = useCallback(() => {
    window.location.href = `${API_BASE}/auth/google`;
  }, []);

  const signOut = useCallback(async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
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

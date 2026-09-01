import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ROLE_KEY = 'citadel.role';
const CUSTOMER_NAME_KEY = 'citadel.customerName';

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

// Demo-mode role switching only — there is no auth backend. Role is
// stored client-side and never treated as a real authorization boundary.
// See .ai/FRONTEND-REBUILD-PLAN.md section 2.
export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => localStorage.getItem(ROLE_KEY));
  const [customerName, setCustomerNameState] = useState(() => localStorage.getItem(CUSTOMER_NAME_KEY) || '');

  useEffect(() => {
    if (role) localStorage.setItem(ROLE_KEY, role);
    else localStorage.removeItem(ROLE_KEY);
  }, [role]);

  useEffect(() => {
    if (customerName) localStorage.setItem(CUSTOMER_NAME_KEY, customerName);
  }, [customerName]);

  const setRole = useCallback((next) => setRoleState(next), []);
  const setCustomerName = useCallback((name) => setCustomerNameState(name), []);
  const exitRole = useCallback(() => {
    setRoleState(null);
    localStorage.removeItem(ROLE_KEY);
  }, []);

  const value = useMemo(
    () => ({ role, setRole, exitRole, customerName, setCustomerName }),
    [role, setRole, exitRole, customerName, setCustomerName]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

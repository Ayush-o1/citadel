import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from './RoleContext.jsx';

// Route guard for demo purposes only — redirects to the entry screen if no
// role is chosen, or if the chosen role doesn't match this subtree. This is
// NOT authorization; it's a UX guard, and is described as such in the UI.
export default function RoleGate({ allow }) {
  const { role } = useRole();

  if (!role) return <Navigate to="/" replace />;
  if (!allow.includes(role)) return <Navigate to="/" replace />;

  return <Outlet />;
}

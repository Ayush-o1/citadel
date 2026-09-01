import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from './RoleContext.jsx';
import LoadingState from '../components/LoadingState.jsx';

// Route guard: redirects to the entry screen if there's no signed-in user,
// no role chosen yet, or the chosen role doesn't match this subtree.
//
// This checks the real, server-persisted role from the authenticated
// session (see RoleContext) — but it is still only a UX guard, not the
// authorization boundary. The API enforces its own rules independently
// (e.g. checkouts.service.js's user_id ownership check) so that hiding a
// route here is never the only thing standing between a user and data
// that isn't theirs.
export default function RoleGate({ allow }) {
  const { loading, role } = useRole();

  if (loading) return <LoadingState label="Loading…" />;
  if (!role) return <Navigate to="/" replace />;
  if (!allow.includes(role)) return <Navigate to="/" replace />;

  return <Outlet />;
}

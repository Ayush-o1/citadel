import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ROLES, ROLE_LABELS, useRole } from '../app/RoleContext.jsx';
import LoadingState from '../components/LoadingState.jsx';

const ROLE_HOMES = {
  [ROLES.CUSTOMER]: '/customer',
  [ROLES.DEALER]: '/dealer',
  [ROLES.ADMIN]: '/admin',
};

// Real, server-persisted role change on the same authenticated account
// (a genuine PATCH, not a client-side toggle) — this is what lets one
// Google sign-in demo all three roles. See RoleContext.jsx / migration
// 010_create_users.sql.
export default function SwitchRole() {
  const { loading, user, role: currentRole, setRole } = useRole();
  const navigate = useNavigate();
  const [pendingRole, setPendingRole] = useState(null);
  const [error, setError] = useState(null);

  if (loading) return <LoadingState label="Loading…" />;
  if (!user) return <Navigate to="/" replace />;

  async function choose(targetRole) {
    setError(null);
    setPendingRole(targetRole);
    try {
      await setRole(targetRole);
      navigate(ROLE_HOMES[targetRole]);
    } catch (err) {
      setError(err.message);
      setPendingRole(null);
    }
  }

  return (
    <div className="entry">
      <section className="entry-hero">
        <p className="entry-eyebrow">Switch role</p>
        <h1>Continue as…</h1>
        <p className="entry-lede">
          Still signed in as {user.name}. Choosing a role updates your account and takes you straight there.
        </p>
      </section>

      <section className="entry-roles">
        {error && <p className="form-error">{error}</p>}
        <div className="entry-role-grid">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <article key={role} className={`entry-role-card${role === currentRole ? ' entry-role-card-current' : ''}`}>
              <h2>{label}</h2>
              {role === currentRole && <p className="entry-role-tagline">Current role</p>}
              <button type="button" disabled={pendingRole !== null} onClick={() => choose(role)}>
                {pendingRole === role ? 'Switching…' : `Continue as ${label}`}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

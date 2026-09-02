import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ROLES, ROLE_LABELS, useRole } from '../app/RoleContext.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Footer from '../components/layout/Footer.jsx';

const ROLE_CARDS = [
  {
    role: ROLES.CUSTOMER,
    tagline: 'Rent the machine for the job in front of you.',
    home: '/customer',
    photo: '/equipment/excavator.jpg',
  },
  {
    role: ROLES.DEALER,
    tagline: 'Run the yard. Check out, track, and act.',
    home: '/dealer',
    photo: '/equipment/bulldozer.webp',
  },
  {
    role: ROLES.ADMIN,
    tagline: 'See the fleet. Decide where capacity goes.',
    home: '/admin',
    photo: '/equipment/crane.jpg',
  },
];

// Real, server-persisted role change on the same authenticated account (a
// genuine PATCH, not a client-side toggle) — this is what lets one Google
// sign-in demo all three roles without three separate accounts, and what
// Entry.jsx's own copy ("You can switch roles later from any screen")
// promises. See RoleContext.jsx / migration 010_create_users.sql.
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
      navigate(ROLE_CARDS.find((c) => c.role === targetRole).home);
    } catch (err) {
      setError(err.message);
      setPendingRole(null);
    }
  }

  return (
    <div className="entry">
      <header className="entry-nav">
        <span className="entry-wordmark entry-wordmark-hero">CITADEL</span>
      </header>

      <section className="entry-identify" aria-label="Switch role">
        <div className="entry-identify-head">
          <h2>Continue as…</h2>
          <p className="entry-roles-label">
            Still signed in as <strong>{user.name}</strong> ({user.email}). Choosing a role updates your
            account and takes you straight there.
          </p>
          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="entry-role-grid">
          {ROLE_CARDS.map((card, i) => (
            <article
              key={card.role}
              className={`entry-role-card${card.role === currentRole ? ' entry-role-card-current' : ''}`}
              style={{ '--stagger': i }}
            >
              <div className="entry-role-photo">
                <img src={card.photo} alt="" loading="lazy" />
              </div>
              <div className="entry-role-body">
                <h3 className="entry-role-title">{ROLE_LABELS[card.role]}</h3>
                <p className="entry-role-tagline">
                  {card.role === currentRole ? 'Current role' : card.tagline}
                </p>
                <button
                  type="button"
                  className="entry-role-cta"
                  disabled={pendingRole !== null}
                  onClick={() => choose(card.role)}
                >
                  {pendingRole === card.role ? 'Switching…' : `Continue as ${ROLE_LABELS[card.role]}`}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

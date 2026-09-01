import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ROLES, ROLE_LABELS, useRole } from '../app/RoleContext.jsx';
import { API_ORIGIN } from '../api/client.js';
import LoadingState from '../components/LoadingState.jsx';

// A missing VITE_API_URL in a production build (see api/client.js) would
// otherwise show up as a mysterious 404 the moment someone clicks
// "Sign in with Google" — this is the same misconfiguration, made
// visible on-screen instead of only in the console, so it's diagnosable
// by anyone testing the deployed app, not just someone with devtools open.
const MISCONFIGURED = import.meta.env.PROD && !API_ORIGIN;

const ROLE_CARDS = [
  {
    role: ROLES.CUSTOMER,
    title: 'Customer',
    tagline: 'Rent equipment for the job in front of you.',
    detail: 'Discover available machines, request a rental, and track your return date.',
    home: '/customer',
  },
  {
    role: ROLES.DEALER,
    title: 'Dealer',
    tagline: 'Run the yard. Check out, track, and act.',
    detail: 'Inventory, checkout, check-in, usage logs, alerts, and a ranked action queue.',
    home: '/dealer',
  },
  {
    role: ROLES.ADMIN,
    title: 'Caterpillar Admin',
    tagline: 'See the fleet. Decide where capacity goes.',
    detail: 'Utilization, anomalies, demand forecasts, and fleet-wide recommendations.',
    home: '/admin',
  },
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

export default function Entry() {
  const { loading, user, role, signIn, setRole } = useRole();
  const [pendingRole, setPendingRole] = useState(null);
  const [error, setError] = useState(null);

  if (loading) return <LoadingState label="Loading…" />;

  if (role) {
    const home = ROLE_CARDS.find((c) => c.role === role)?.home ?? '/';
    return <Navigate to={home} replace />;
  }

  async function choose(targetRole) {
    setError(null);
    setPendingRole(targetRole);
    try {
      await setRole(targetRole);
    } catch (err) {
      setError(err.message);
      setPendingRole(null);
    }
  }

  return (
    <div className="entry">
      <section className="entry-hero">
        <p className="entry-eyebrow">Smart Rental Tracking</p>
        <h1>Citadel</h1>
        <p className="entry-lede">
          One system to track heavy equipment from checkout to return — built for the people who rent it,
          the dealers who run it, and the fleet owner who has to answer for it.
        </p>
        <div className="entry-trust-row">
          <span className="entry-trust-item">Live equipment status</span>
          <span className="entry-trust-item">Explainable anomaly detection</span>
          <span className="entry-trust-item">Real Google sign-in</span>
        </div>
      </section>

      {!user ? (
        <section className="entry-signin" aria-label="Sign in">
          {MISCONFIGURED ? (
            <p className="form-error" style={{ maxWidth: 480, textAlign: 'center' }}>
              Sign-in is unavailable: this deployment is missing its API URL configuration
              (<code>VITE_API_URL</code>). This is a deployment setup issue, not something you can fix here — see{' '}
              <code>.ai/DEPLOYMENT.md</code> if you're setting this up.
            </p>
          ) : (
            <>
              <button type="button" className="google-signin-button" onClick={signIn}>
                <GoogleIcon />
                Sign in with Google
              </button>
              <p className="entry-signin-note">
                Real Google Sign-In. Your name, email, and photo come from your Google account; Citadel never sees
                your Google password.
              </p>
            </>
          )}
        </section>
      ) : (
        <section className="entry-roles" aria-label="Choose how you're using Citadel">
          <p className="entry-roles-label">
            Signed in as <strong>{user.name}</strong> ({user.email}) — choose how you'd like to use Citadel. You can
            switch roles later from any screen.
          </p>
          {error && <p className="form-error">{error}</p>}
          <div className="entry-role-grid">
            {ROLE_CARDS.map((card) => (
              <article key={card.role} className="entry-role-card">
                <h2>{card.title}</h2>
                <p className="entry-role-tagline">{card.tagline}</p>
                <p className="entry-role-detail">{card.detail}</p>
                <button type="button" disabled={pendingRole !== null} onClick={() => choose(card.role)}>
                  {pendingRole === card.role ? 'Setting up…' : `Continue as ${card.title}`}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

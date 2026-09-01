import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ROLES, ROLE_LABELS, useRole } from '../app/RoleContext.jsx';

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

export default function Entry() {
  const { role, setRole, customerName, setCustomerName } = useRole();
  const [pendingCustomerName, setPendingCustomerName] = useState(customerName);
  const [selecting, setSelecting] = useState(null);

  if (role) {
    const home = ROLE_CARDS.find((c) => c.role === role)?.home ?? '/';
    return <Navigate to={home} replace />;
  }

  function choose(targetRole) {
    if (targetRole === ROLES.CUSTOMER) {
      setSelecting(ROLES.CUSTOMER);
      return;
    }
    setRole(targetRole);
  }

  function confirmCustomer(event) {
    event.preventDefault();
    setCustomerName(pendingCustomerName.trim() || 'Guest');
    setRole(ROLES.CUSTOMER);
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
      </section>

      <section className="entry-roles" aria-label="Choose how you're using Citadel">
        <p className="entry-roles-label">Demo mode — choose a role to continue. This simulates role switching; it is not a real login.</p>
        <div className="entry-role-grid">
          {ROLE_CARDS.map((card) => (
            <article key={card.role} className="entry-role-card">
              <h2>{card.title}</h2>
              <p className="entry-role-tagline">{card.tagline}</p>
              <p className="entry-role-detail">{card.detail}</p>

              {selecting === card.role ? (
                <form onSubmit={confirmCustomer} className="entry-customer-form">
                  <label>
                    Your name
                    <input
                      type="text"
                      value={pendingCustomerName}
                      onChange={(e) => setPendingCustomerName(e.target.value)}
                      placeholder="e.g. Priya Shah"
                      autoFocus
                    />
                  </label>
                  <button type="submit">Continue as {ROLE_LABELS[ROLES.CUSTOMER]}</button>
                </form>
              ) : (
                <button type="button" onClick={() => choose(card.role)}>
                  Continue as {card.title}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import { Link, NavLink, Outlet } from 'react-router-dom';
import { ROLES, ROLE_LABELS, useRole } from '../../app/RoleContext.jsx';

const NAV_BY_ROLE = {
  [ROLES.CUSTOMER]: [
    { to: '/customer', label: 'Discover', end: true },
    { to: '/customer/rentals', label: 'My Rentals' },
  ],
  [ROLES.DEALER]: [
    { to: '/dealer', label: 'Control Tower', end: true },
    { to: '/dealer/assets', label: 'Asset Dashboard' },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin', label: 'Fleet', end: true },
    { to: '/admin/utilization', label: 'Utilization' },
    { to: '/admin/capacity', label: 'Capacity' },
    { to: '/admin/anomalies', label: 'Anomalies' },
    { to: '/admin/forecasts', label: 'Forecasts' },
    { to: '/admin/recommendations', label: 'Recommendations' },
  ],
};

export default function AppShell() {
  const { role, exitRole } = useRole();
  const links = NAV_BY_ROLE[role] ?? [];

  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="brand">
          Citadel
        </Link>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="role-indicator">
          <span className="role-pill">{ROLE_LABELS[role]}</span>
          <button type="button" className="role-switch" onClick={exitRole}>
            Switch role
          </button>
        </div>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

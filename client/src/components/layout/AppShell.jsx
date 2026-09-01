import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
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
    { to: '/admin', label: 'Control Tower', end: true },
    { to: '/admin/fleet', label: 'Fleet' },
    { to: '/admin/utilization', label: 'Utilization' },
    { to: '/admin/capacity', label: 'Capacity' },
    { to: '/admin/anomalies', label: 'Anomalies' },
    { to: '/admin/forecasts', label: 'Forecasts' },
  ],
};

export default function AppShell() {
  const { role, user, signOut } = useRole();
  const navigate = useNavigate();
  const links = NAV_BY_ROLE[role] ?? [];

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="layout-header">
        <Link to="/" className="brand">
          Citadel
        </Link>
        <nav aria-label="Primary">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="role-indicator">
          {user?.avatar_url && <img src={user.avatar_url} alt="" className="user-avatar" referrerPolicy="no-referrer" />}
          <span className="role-pill">{ROLE_LABELS[role]}</span>
          <Link to="/switch-role" className="role-switch">
            Switch role
          </Link>
          <button type="button" className="role-switch" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="layout-main" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}

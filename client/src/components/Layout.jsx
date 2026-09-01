import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="brand">
          Citadel
        </Link>
        <nav>
          <Link to="/">Control Tower</Link>
          <Link to="/assets">Asset Dashboard</Link>
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

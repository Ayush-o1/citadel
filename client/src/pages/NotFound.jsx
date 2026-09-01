import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="not-found">
      <p className="not-found-code">404</p>
      <h1>That page doesn't exist</h1>
      <p className="page-subtitle" style={{ margin: '0 auto var(--space-5)' }}>
        The link may be out of date, or the page moved.
      </p>
      <Link to="/" className="empty-state-action">
        Go home
      </Link>
    </section>
  );
}

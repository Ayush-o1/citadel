import { Link, useSearchParams } from 'react-router-dom';

export default function AuthError() {
  const [params] = useSearchParams();
  const reason = params.get('reason');

  return (
    <div className="entry">
      <section className="entry-hero">
        <p className="entry-eyebrow">Sign-in failed</p>
        <h1>Something went wrong</h1>
        <p className="entry-lede">
          {reason === 'access_denied'
            ? 'Google sign-in was cancelled.'
            : 'Google sign-in did not complete. Please try again.'}
        </p>
        <Link to="/" className="empty-state-action">
          Back to sign in
        </Link>
      </section>
    </div>
  );
}

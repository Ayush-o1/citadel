import { Link, useSearchParams } from 'react-router-dom';

export default function AuthError() {
  const [params] = useSearchParams();
  const reason = params.get('reason');

  // Every non-'access_denied' reason the server sends here is a hand-authored,
  // safe, stage-labeled message (see auth.controller.js/auth.service.js) —
  // never a raw exception or secret — so it's fine to show directly instead
  // of behind a generic "please try again."
  const message =
    reason === 'access_denied' ? 'Google sign-in was cancelled.' : reason || 'Google sign-in did not complete. Please try again.';

  return (
    <div className="entry">
      <section className="entry-hero">
        <p className="entry-eyebrow">Sign-in failed</p>
        <h1>Something went wrong</h1>
        <p className="entry-lede">{message}</p>
        <Link to="/" className="empty-state-action">
          Back to sign in
        </Link>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';

// action is optional: { label, to } for a Link, or { label, onClick } for a
// button (e.g. "clear filter"). An empty state without a next step is a
// dead end -- most call sites should give the user somewhere to go.
export default function EmptyState({ message = 'Nothing here yet.', action }) {
  return (
    <div className="state state-empty">
      <span className="state-empty-icon" aria-hidden="true">○</span>
      <p>{message}</p>
      {action &&
        (action.to ? (
          <Link to={action.to} className="empty-state-action">
            {action.label}
          </Link>
        ) : (
          <button type="button" className="empty-state-action" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

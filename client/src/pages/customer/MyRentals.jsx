import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { listCheckouts, checkIn } from '../../api/checkouts.js';
import { useRole } from '../../app/RoleContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function MyRentals() {
  const { customerName } = useRole();
  const { data: checkouts, loading, error, refetch } = useApi(
    () => listCheckouts({ customerName }),
    [customerName]
  );
  const [busyId, setBusyId] = useState(null);
  const [returnError, setReturnError] = useState(null);

  if (loading) return <LoadingState label="Loading your rentals…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!checkouts || checkouts.length === 0) {
    return (
      <EmptyState
        message="No rentals yet."
        action={{ label: 'Browse equipment', to: '/customer' }}
      />
    );
  }

  async function handleReturn(checkout) {
    setReturnError(null);
    setBusyId(checkout.id);
    try {
      await checkIn(checkout.id, { customer_name: customerName });
      refetch();
    } catch (err) {
      setReturnError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h1>My rentals</h1>
      <p className="page-subtitle">Signed in as {customerName}.</p>
      {returnError && <p className="form-error">{returnError}</p>}

      <ul className="rental-list">
        {checkouts.map((c) => (
          <li key={c.id} className="rental-card">
            <div>
              <p className="rental-card-title">
                {c.equipment_code} · {c.equipment_type}
              </p>
              <p className="summary-caption">
                Checked out {new Date(c.checked_out_at).toLocaleDateString()}
                {c.expected_return_at ? ` · due ${new Date(c.expected_return_at).toLocaleDateString()}` : ''}
              </p>
              {c.is_overdue && <p className="form-error">Overdue — please return as soon as possible.</p>}
              {!c.is_overdue && c.is_upcoming_return && (
                <p className="form-notice">Due back soon.</p>
              )}
            </div>
            <div className="rental-card-actions">
              <StatusBadge status={c.is_overdue ? 'overdue' : c.status === 'active' ? 'checked_out' : c.status} />
              {c.status === 'active' && (
                <button type="button" disabled={busyId === c.id} onClick={() => handleReturn(c)}>
                  {busyId === c.id ? 'Returning…' : 'Return equipment'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

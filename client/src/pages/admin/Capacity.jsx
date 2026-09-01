import { useApi } from '../../hooks/useApi.js';
import { getCapacitySummary } from '../../api/capacity.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function Capacity() {
  const { data, loading, error, refetch } = useApi(getCapacitySummary);

  if (loading) return <LoadingState label="Loading capacity signals…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const activeCheckouts = data?.active_checkouts ?? [];
  const flagged = activeCheckouts.filter((s) => s.underutilized_capacity);
  const watching = activeCheckouts.filter((s) => !s.underutilized_capacity);

  return (
    <section>
      <h1>Capacity</h1>
      <p className="page-subtitle">
        Where rented capacity is running ahead of the workload — utilization measured against an assumed
        per-type capacity, compared to how long similar rentals typically take.
      </p>

      {activeCheckouts.length === 0 && (
        <EmptyState message="No underutilized active rentals right now — nothing running meaningfully below capacity." />
      )}

      {flagged.length > 0 && (
        <>
          <h2 className="capacity-section-title">Review for early return or reassignment</h2>
          <div className="admin-grid">
            {flagged.map((s) => (
              <div key={s.checkout_id} className="summary-card capacity-card capacity-card-flagged">
                <div className="utilization-row">
                  <h3 style={{ margin: 0 }}>
                    {s.equipment_code} · {s.equipment_type}
                  </h3>
                  <span className="utilization-band utilization-band-underutilized">
                    {Math.round(s.utilization_ratio * 100)}%
                  </span>
                </div>
                <p className="summary-caption">
                  {s.observed_daily_rate}h/day observed vs. an assumed {s.assumed_capacity_hours}h/day capacity.
                </p>
                <p className="capacity-estimate">
                  Est. completion: {s.estimated_completion_days_low}-{s.estimated_completion_days_high} days
                  {s.remaining_rental_days !== null && ` · ${s.remaining_rental_days} days remaining on the rental`}
                </p>
                <ul className="capacity-assumptions">
                  {s.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {watching.length > 0 && (
        <>
          <h2 className="capacity-section-title">Below capacity, not enough history to estimate completion</h2>
          <div className="admin-grid">
            {watching.map((s) => (
              <div key={s.checkout_id} className="summary-card capacity-card">
                <div className="utilization-row">
                  <h3 style={{ margin: 0 }}>
                    {s.equipment_code} · {s.equipment_type}
                  </h3>
                  <span className="utilization-band utilization-band-underutilized">
                    {Math.round(s.utilization_ratio * 100)}%
                  </span>
                </div>
                <p className="summary-caption">{s.note}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

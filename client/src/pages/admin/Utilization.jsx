import { useApi } from '../../hooks/useApi.js';
import { getUtilization } from '../../api/utilization.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const BAND_LABELS = {
  healthy: 'Healthy',
  underutilized: 'Underutilized',
  overutilized: 'Overutilized',
  insufficient_data: 'No data',
};

const BAND_COPY = {
  healthy: 'Runtime falls inside the 65-75% band — no action needed.',
  underutilized: 'Below 65% runtime — capacity is likely available for reallocation.',
  overutilized: 'Above 75% runtime — this type is running hot; watch for maintenance risk.',
  insufficient_data: 'Not enough logged usage yet to classify.',
};

export default function Utilization() {
  const { data, loading, error, refetch } = useApi(getUtilization);

  if (loading) return <LoadingState label="Loading utilization…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  const rows = data?.by_type ?? [];
  if (rows.length === 0) return <EmptyState message="No utilization data yet." />;

  return (
    <section>
      <h1>Utilization</h1>
      <p className="page-subtitle">
        Runtime vs. idle hours by equipment type, fleet-wide. Healthy band: 65-75% runtime.
      </p>

      <div className="admin-utilization-list">
        {rows.map((row) => (
          <div key={row.equipment_type} className="summary-card">
            <div className="utilization-row">
              <h3 style={{ margin: 0 }}>{row.equipment_type}</h3>
              <span className={`utilization-band utilization-band-${row.band}`}>
                {row.utilization_ratio !== null ? `${Math.round(row.utilization_ratio * 100)}%` : '—'}
                {' · '}
                {BAND_LABELS[row.band]}
              </span>
            </div>
            <p className="summary-caption">{BAND_COPY[row.band]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

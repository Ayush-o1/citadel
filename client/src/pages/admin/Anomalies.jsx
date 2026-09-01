import { useApi } from '../../hooks/useApi.js';
import { listAnomalies } from '../../api/anomalies.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const TYPE_LABELS = {
  excessive_idle: 'Excessive idle',
  zero_runtime: 'Zero runtime',
  missing_assignment: 'Missing assignment',
  unusual_movement: 'Unusual movement',
};

export default function Anomalies() {
  const { data: anomalies, loading, error, refetch } = useApi(listAnomalies);

  if (loading) return <LoadingState label="Loading anomalies…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!anomalies || anomalies.length === 0) {
    return <EmptyState message="No open anomalies — the fleet is behaving as expected." />;
  }

  return (
    <section>
      <h1>Anomaly intelligence</h1>
      <p className="page-subtitle">What was flagged, why, and the evidence behind it — across the whole fleet.</p>

      <ul className="anomaly-list">
        {anomalies.map((a) => (
          <li key={a.id} className={`action-item action-item-${a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'info'}`}>
            <div className="action-item-body">
              <p className="action-item-signal">
                {a.equipment_code} · {TYPE_LABELS[a.type] ?? a.type}
              </p>
              <p className="action-item-reason">{a.reason}</p>
            </div>
            <StatusBadge status={a.severity} />
          </li>
        ))}
      </ul>
    </section>
  );
}

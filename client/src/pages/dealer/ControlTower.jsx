import { useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { listRecommendations, updateRecommendationStatus } from '../../api/recommendations.js';
import { listEquipment } from '../../api/equipment.js';
import { listForecasts } from '../../api/forecasts.js';
import { getUtilization } from '../../api/utilization.js';
import ActionQueueItem from '../../components/ActionQueueItem.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { summarizeTopSignal } from '../../utils/summarize.js';

const LIVE_STATUS_ORDER = ['available', 'checked_out', 'overdue', 'maintenance'];

const BAND_LABELS = {
  healthy: 'Healthy',
  underutilized: 'Underutilized',
  overutilized: 'Overutilized',
  insufficient_data: 'No data',
};

export default function ControlTower() {
  const { data: recommendations, loading, error, refetch } = useApi(listRecommendations);
  const { data: equipment } = useApi(listEquipment);
  const { data: forecasts } = useApi(listForecasts);
  const { data: utilization } = useApi(getUtilization);

  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const statusCounts = useMemo(() => {
    const counts = { available: 0, checked_out: 0, overdue: 0, maintenance: 0 };
    for (const item of equipment ?? []) {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
    }
    return counts;
  }, [equipment]);

  async function handleAction(id, status) {
    setActionError(null);
    setBusyId(id);
    try {
      await updateRecommendationStatus(id, status);
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h1>Control Tower</h1>
      <p className="page-subtitle">What needs attention, why, and what to do about it.</p>

      <div className="control-tower-grid">
        <div className="action-queue-panel">
          <h2>Action Queue</h2>
          {!loading && !error && recommendations && recommendations.length > 0 && (
            <p className="top-priority-banner">{summarizeTopSignal(recommendations[0])}</p>
          )}
          {actionError && <p className="form-error">{actionError}</p>}

          {loading && <LoadingState label="Loading the Action Queue…" />}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && (!recommendations || recommendations.length === 0) && (
            <EmptyState message="Nothing needs attention right now — the fleet is healthy." />
          )}
          {!loading && !error && recommendations && recommendations.length > 0 && (
            <ul className="action-queue">
              {recommendations.map((item) => (
                <ActionQueueItem key={item.id} item={item} onAction={handleAction} busy={busyId === item.id} />
              ))}
            </ul>
          )}
        </div>

        <aside className="control-tower-sidebar">
          <div className="summary-card">
            <h3>Live status</h3>
            <ul className="summary-list">
              {LIVE_STATUS_ORDER.map((status) => (
                <li key={status}>
                  <StatusBadge status={status} />
                  <span>{statusCounts[status]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="summary-card">
            <h3>Utilization</h3>
            <p className="summary-caption">Healthy band: 65-75% runtime</p>
            {(utilization?.by_type ?? []).map((row) => (
              <div key={row.equipment_type} className="utilization-row">
                <span>{row.equipment_type}</span>
                <span className={`utilization-band utilization-band-${row.band}`}>
                  {row.utilization_ratio !== null ? `${Math.round(row.utilization_ratio * 100)}%` : '—'}
                  {' · '}
                  {BAND_LABELS[row.band]}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-card">
            <h3>Forecast</h3>
            {(forecasts ?? []).length === 0 && <p className="summary-caption">No forecast groups yet.</p>}
            {(forecasts ?? []).map((forecast) => (
              <div key={`${forecast.equipment_type}-${forecast.site.code}`} className="forecast-row">
                <p className="forecast-title">
                  {forecast.equipment_type} @ {forecast.site.code}
                </p>
                {forecast.insufficient_history ? (
                  <p className="summary-caption">Insufficient history — {forecast.note}</p>
                ) : (
                  <p className="summary-caption">{forecast.factors}</p>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

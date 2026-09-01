import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { listEquipment } from '../../api/equipment.js';
import { listRecommendations, updateRecommendationStatus } from '../../api/recommendations.js';
import { listAnomalies } from '../../api/anomalies.js';
import { getCapacitySummary } from '../../api/capacity.js';
import { getUtilization } from '../../api/utilization.js';
import ActionQueueItem from '../../components/ActionQueueItem.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { summarizeTopSignal } from '../../utils/summarize.js';

const STATUS_ORDER = ['available', 'checked_out', 'overdue', 'maintenance'];
const STATUS_TONE = { available: 'neutral', checked_out: 'info', overdue: 'danger', maintenance: 'warning' };

// Admin's landing page, not Fleet Overview's tables — the fix for the
// biggest gap found in this pass: the problem statement's own principle
// ("the dashboard should not only report, it should recommend") was built
// for Dealer's Control Tower but not for Admin, whose home page was two
// static tables with nothing ranked or actionable. Same
// Attention -> Explanation -> Action pattern as Dealer, deliberately
// different altitude: the queue spans the whole fleet with strategic
// framing (mark actioned/dismissed is a triage decision, not an
// operational one), and the sidebar shows aggregate counts, never a
// per-asset list or a checkout/check-in action — Admin observes and
// recommends, Dealer executes (DESIGN decision, unchanged).
export default function AdminControlTower() {
  const { data: recommendations, loading, error, refetch } = useApi(listRecommendations);
  const { data: equipment } = useApi(listEquipment);
  const { data: anomalies } = useApi(listAnomalies);
  const { data: capacity } = useApi(getCapacitySummary);
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

  const unassignedCount = useMemo(
    () => (equipment ?? []).filter((e) => !e.active_checkout?.site && !e.home_site).length,
    [equipment]
  );

  const anomalyHighCount = useMemo(
    () => (anomalies ?? []).filter((a) => a.severity === 'high').length,
    [anomalies]
  );

  const capacityFlaggedCount = useMemo(
    () => (capacity?.active_checkouts ?? []).filter((c) => c.underutilized_capacity).length,
    [capacity]
  );

  const outOfBandTypes = useMemo(
    () => (utilization?.by_type ?? []).filter((r) => r.band === 'overutilized' || r.band === 'underutilized').length,
    [utilization]
  );

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
      <h1>Fleet Control Tower</h1>
      <p className="page-subtitle">What needs attention across the whole fleet, why, and what to decide next.</p>

      <div className="control-tower-grid">
        <div className="action-queue-panel">
          <h2>Recommendations</h2>
          {!loading && !error && recommendations && recommendations.length > 0 && (
            <p className="top-priority-banner">{summarizeTopSignal(recommendations[0])}</p>
          )}
          {actionError && <p className="form-error">{actionError}</p>}

          {loading && <LoadingState label="Loading recommendations…" />}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && (!recommendations || recommendations.length === 0) && (
            <EmptyState message="Nothing pending — every signal has been actioned or dismissed." />
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
            <h3>Fleet status</h3>
            <ul className="summary-list">
              {STATUS_ORDER.map((status) => (
                <li key={status}>
                  <span className={`status-badge status-badge-${STATUS_TONE[status]}`}>{status.replace('_', ' ')}</span>
                  <span>{statusCounts[status]}</span>
                </li>
              ))}
            </ul>
            <Link to="/admin/fleet" className="equipment-card-cta">
              Full fleet breakdown →
            </Link>
          </div>

          <div className="summary-card">
            <h3>Exceptions</h3>
            <ul className="summary-list">
              <li className={anomalyHighCount > 0 ? 'summary-list-flag' : undefined}>
                <span>High-severity anomalies</span>
                <span>{anomalyHighCount}</span>
              </li>
              <li className={capacityFlaggedCount > 0 ? 'summary-list-flag' : undefined}>
                <span>Rentals below capacity</span>
                <span>{capacityFlaggedCount}</span>
              </li>
              <li className={unassignedCount > 0 ? 'summary-list-flag' : undefined}>
                <span>Equipment with no home site</span>
                <span>{unassignedCount}</span>
              </li>
              <li className={outOfBandTypes > 0 ? 'summary-list-flag' : undefined}>
                <span>Types outside the healthy band</span>
                <span>{outOfBandTypes}</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

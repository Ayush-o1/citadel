import { useApi } from '../../hooks/useApi.js';
import { listForecasts } from '../../api/forecasts.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function Forecasts() {
  const { data: forecasts, loading, error, refetch } = useApi(listForecasts);

  if (loading) return <LoadingState label="Loading forecasts…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!forecasts || forecasts.length === 0) {
    return <EmptyState message="No forecast groups yet — needs at least one checkout history per type/site." />;
  }

  return (
    <section>
      <h1>Demand forecast</h1>
      <p className="page-subtitle">
        What's likely to be needed, where, and why — trailing 28-day checkout volume by equipment type and site.
      </p>

      <div className="admin-grid">
        {forecasts.map((f) => (
          <div key={`${f.equipment_type}-${f.site.code}`} className="summary-card">
            <h3>
              {f.equipment_type} @ {f.site.code}
            </h3>
            {f.insufficient_history ? (
              <p className="summary-caption">Insufficient history — {f.note}</p>
            ) : (
              <>
                <p className="forecast-number">{f.predicted_demand} checkouts/week</p>
                <p className="summary-caption">Trend: {f.trend}. {f.factors}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

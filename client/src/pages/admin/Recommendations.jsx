import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { listRecommendations, updateRecommendationStatus } from '../../api/recommendations.js';
import ActionQueueItem from '../../components/ActionQueueItem.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function Recommendations() {
  const { data: recommendations, loading, error, refetch } = useApi(listRecommendations);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

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

  if (loading) return <LoadingState label="Loading recommendations…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!recommendations || recommendations.length === 0) {
    return <EmptyState message="Nothing pending — every signal has been actioned or dismissed." />;
  }

  return (
    <section>
      <h1>Fleet recommendations</h1>
      <p className="page-subtitle">
        Every signal — alert, anomaly, or forecast — ranked, with the reason and the expected impact of acting on it.
      </p>
      {actionError && <p className="form-error">{actionError}</p>}

      <ul className="action-queue">
        {recommendations.map((item) => (
          <ActionQueueItem key={item.id} item={item} onAction={handleAction} busy={busyId === item.id} />
        ))}
      </ul>
    </section>
  );
}

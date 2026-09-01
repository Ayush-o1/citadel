import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { listEquipment } from '../../api/equipment.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import EquipmentImage from '../../components/customer/EquipmentImage.jsx';
import PageHero from '../../components/layout/PageHero.jsx';

export default function Discover() {
  const { data: equipment, loading, error, refetch } = useApi(listEquipment);
  const [typeFilter, setTypeFilter] = useState('all');

  const available = useMemo(() => (equipment ?? []).filter((e) => e.status === 'available'), [equipment]);
  const types = useMemo(() => ['all', ...new Set(available.map((e) => e.type))], [available]);
  const visible = useMemo(
    () => (typeFilter === 'all' ? available : available.filter((e) => e.type === typeFilter)),
    [available, typeFilter]
  );

  if (loading) return <LoadingState label="Loading available equipment…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <section>
      <PageHero
        eyebrow="Customer workspace"
        title="Find your next machine"
        subtitle="Available equipment across the fleet, ready to rent today."
        photo="/equipment/excavator.jpg"
      />

      <div className="discover-filters" role="group" aria-label="Filter by equipment type">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            className={`filter-chip ${typeFilter === type ? 'filter-chip-active' : ''}`}
            onClick={() => setTypeFilter(type)}
          >
            {type === 'all' ? 'All types' : type}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          message="No available equipment matches that filter right now."
          action={typeFilter !== 'all' ? { label: 'Clear filter', onClick: () => setTypeFilter('all') } : undefined}
        />
      ) : (
        <div className="equipment-grid">
          {visible.map((item) => (
            <Link key={item.id} to={`/customer/equipment/${item.id}`} className="equipment-card">
              <EquipmentImage type={item.type} />
              <div className="equipment-card-body">
                <p className="equipment-card-type">{item.type}</p>
                <p className="equipment-card-code">{item.code}</p>
                {item.home_site && <p className="equipment-card-site">Located at {item.home_site.code}</p>}
                <span className="equipment-card-cta">View details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

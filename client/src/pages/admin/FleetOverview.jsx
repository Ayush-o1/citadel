import { useMemo } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { listEquipment } from '../../api/equipment.js';
import { listSites } from '../../api/referenceData.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';

const STATUS_ORDER = ['available', 'checked_out', 'overdue', 'maintenance'];

export default function FleetOverview() {
  const { data: equipment, loading, error, refetch } = useApi(listEquipment);
  const { data: sites } = useApi(listSites);

  const byType = useMemo(() => {
    const map = new Map();
    for (const item of equipment ?? []) {
      if (!map.has(item.type)) map.set(item.type, { total: 0, ...Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) });
      const row = map.get(item.type);
      row.total += 1;
      row[item.status] = (row[item.status] ?? 0) + 1;
    }
    return [...map.entries()];
  }, [equipment]);

  const bySite = useMemo(() => {
    const map = new Map((sites ?? []).map((s) => [s.code, { site: s, count: 0 }]));
    map.set('unassigned', { site: { code: 'Unassigned' }, count: 0 });
    for (const item of equipment ?? []) {
      const code = item.active_checkout?.site?.code ?? item.home_site?.code ?? 'unassigned';
      if (!map.has(code)) map.set(code, { site: { code }, count: 0 });
      map.get(code).count += 1;
    }
    return [...map.values()].filter((row) => row.count > 0);
  }, [equipment, sites]);

  if (loading) return <LoadingState label="Loading fleet…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <section>
      <h1>Fleet overview</h1>
      <p className="page-subtitle">Where the fleet is, by equipment type and by site — the starting point for allocation decisions.</p>

      <div className="admin-grid">
        <div className="summary-card">
          <h3>Status by equipment type</h3>
          <div className="table-scroll">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Total</th>
                  {STATUS_ORDER.map((s) => (
                    <th key={s}><StatusBadge status={s} /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byType.map(([type, row]) => (
                  <tr key={type}>
                    <td>{type}</td>
                    <td>{row.total}</td>
                    {STATUS_ORDER.map((s) => (
                      <td key={s}>{row[s]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="summary-card">
          <h3>Allocation by site</h3>
          <ul className="summary-list">
            {bySite.map((row) => {
              const isUnassigned = row.site.code === 'Unassigned';
              return (
                <li key={row.site.code} className={isUnassigned ? 'summary-list-flag' : undefined}>
                  <span>
                    {row.site.code}
                    {isUnassigned && ' — no home site set'}
                  </span>
                  <span>{row.count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

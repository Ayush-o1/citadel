import { useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { listEquipment } from '../../api/equipment.js';
import { listSites, listOperators } from '../../api/referenceData.js';
import { checkOut, checkIn } from '../../api/checkouts.js';
import { logUsage } from '../../api/usageLogs.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

// One accessor per sortable column (DESIGN.md: sortable by status/site/
// return date, no pagination needed at this data scale).
const SORT_ACCESSORS = {
  code: (e) => e.code,
  status: (e) => e.status,
  site: (e) => e.active_checkout?.site?.code ?? e.home_site?.code ?? '',
  return: (e) => e.active_checkout?.expected_return_at ?? '',
};

const SORT_LABELS = { code: 'Asset', status: 'Status', site: 'Site', return: 'Return date' };

export default function AssetDashboard() {
  const { data: equipment, loading, error, refetch } = useApi(listEquipment);
  const { data: sites } = useApi(listSites);
  const { data: operators } = useApi(listOperators);

  const [sortKey, setSortKey] = useState('code');
  const [sortDir, setSortDir] = useState('asc');
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [checkInBusyId, setCheckInBusyId] = useState(null);
  const [checkInError, setCheckInError] = useState(null);
  const [usageLogTarget, setUsageLogTarget] = useState(null);
  const [usageLogError, setUsageLogError] = useState(null);
  const [usageLogBusy, setUsageLogBusy] = useState(false);
  const [usageLogNotice, setUsageLogNotice] = useState(null);

  const sorted = useMemo(() => {
    if (!equipment) return [];
    const getValue = SORT_ACCESSORS[sortKey];
    return [...equipment].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [equipment, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function openCheckoutForm(item) {
    setCheckoutTarget(item);
    setFormError(null);
  }

  async function handleCheckoutSubmit(event) {
    event.preventDefault();
    setFormError(null);
    setFormBusy(true);
    const form = new FormData(event.target);
    try {
      await checkOut({
        equipment_id: checkoutTarget.id,
        operator_id: form.get('operator_id') || undefined,
        site_id: form.get('site_id') || undefined,
      });
      setCheckoutTarget(null);
      refetch();
    } catch (err) {
      // REQ (08.7): a duplicate check-out (e.g. a race with another tab)
      // must surface here, inline, not as a silent failure or a crash.
      setFormError(err.message);
    } finally {
      setFormBusy(false);
    }
  }

  async function handleCheckIn(item) {
    setCheckInError(null);
    setCheckInBusyId(item.id);
    try {
      await checkIn(item.active_checkout.id, {});
      refetch();
    } catch (err) {
      setCheckInError(`${item.code}: ${err.message}`);
    } finally {
      setCheckInBusyId(null);
    }
  }

  function openUsageLogForm(item) {
    setUsageLogTarget(item);
    setUsageLogError(null);
  }

  async function handleUsageLogSubmit(event) {
    event.preventDefault();
    setUsageLogError(null);
    setUsageLogBusy(true);
    const form = new FormData(event.target);
    try {
      await logUsage({
        checkout_id: usageLogTarget.active_checkout.id,
        logged_at: form.get('logged_at'),
        engine_hours: Number(form.get('engine_hours')),
        idle_hours: Number(form.get('idle_hours')),
        location: form.get('location') || undefined,
      });
      setUsageLogNotice(`Usage logged for ${usageLogTarget.code}.`);
      setUsageLogTarget(null);
      refetch();
    } catch (err) {
      // REQ-004: a bad/duplicate usage-log entry (e.g. the same date
      // twice) must surface here, not fail silently.
      setUsageLogError(err.message);
    } finally {
      setUsageLogBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading equipment…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!equipment || equipment.length === 0) {
    return <EmptyState message="No equipment in the fleet yet." />;
  }

  return (
    <section>
      <h1>Asset Dashboard</h1>
      <p className="page-subtitle">Every asset's live status, site, and return date — check in or out here.</p>

      {checkInError && <p className="form-error">{checkInError}</p>}
      {usageLogNotice && <p className="form-notice">{usageLogNotice}</p>}

      <div className="table-scroll">
        <table className="asset-table">
          <thead>
            <tr>
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <th key={key}>
                  <button type="button" className="sort-button" onClick={() => toggleSort(key)}>
                    {label}
                    {sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                </th>
              ))}
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.id}>
                <td>{item.code}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td>{item.active_checkout?.site?.code ?? item.home_site?.code ?? '—'}</td>
                <td>
                  {item.active_checkout?.expected_return_at
                    ? new Date(item.active_checkout.expected_return_at).toLocaleString()
                    : '—'}
                </td>
                <td>{item.type}</td>
                <td className="action-cell">
                  {item.active_checkout ? (
                    <>
                      <button type="button" onClick={() => openUsageLogForm(item)}>
                        Log usage
                      </button>
                      <button
                        type="button"
                        className="action-item-dismiss"
                        disabled={checkInBusyId === item.id}
                        onClick={() => handleCheckIn(item)}
                      >
                        {checkInBusyId === item.id ? 'Checking in…' : 'Check in'}
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => openCheckoutForm(item)}>
                      Check out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {checkoutTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Check out ${checkoutTarget.code}`}>
          <div className="modal">
            <h2>Check out {checkoutTarget.code}</h2>
            <form onSubmit={handleCheckoutSubmit} className="checkout-form">
              <label>
                Operator
                <select name="operator_id" defaultValue="">
                  <option value="">— none —</option>
                  {(operators ?? []).map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Site
                <select name="site_id" defaultValue="">
                  <option value="">— none —</option>
                  {(sites ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}
                    </option>
                  ))}
                </select>
              </label>
              {formError && <p className="form-error">{formError}</p>}
              <div className="modal-actions">
                <button type="button" onClick={() => setCheckoutTarget(null)} disabled={formBusy}>
                  Cancel
                </button>
                <button type="submit" disabled={formBusy}>
                  {formBusy ? 'Checking out…' : 'Confirm check-out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {usageLogTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Log usage for ${usageLogTarget.code}`}>
          <div className="modal">
            <h2>Log usage for {usageLogTarget.code}</h2>
            <form onSubmit={handleUsageLogSubmit} className="checkout-form">
              <label>
                Date
                <input type="date" name="logged_at" defaultValue={new Date().toISOString().slice(0, 10)} required />
              </label>
              <label>
                Engine hours
                <input type="number" name="engine_hours" min="0" step="0.1" defaultValue="0" required />
              </label>
              <label>
                Idle hours
                <input type="number" name="idle_hours" min="0" step="0.1" defaultValue="0" required />
              </label>
              <label>
                Location (optional)
                <input type="text" name="location" placeholder="e.g. Site S003 yard" />
              </label>
              {usageLogError && <p className="form-error">{usageLogError}</p>}
              <div className="modal-actions">
                <button type="button" onClick={() => setUsageLogTarget(null)} disabled={usageLogBusy}>
                  Cancel
                </button>
                <button type="submit" disabled={usageLogBusy}>
                  {usageLogBusy ? 'Logging…' : 'Log usage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

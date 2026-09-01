import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { getEquipment } from '../../api/equipment.js';
import { checkOut } from '../../api/checkouts.js';
import { getCapacitySummary } from '../../api/capacity.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EquipmentImage from '../../components/customer/EquipmentImage.jsx';
import { useRole } from '../../app/RoleContext.jsx';

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customerName } = useRole();
  const { data: equipment, loading, error } = useApi(() => getEquipment(id), [id]);
  const { data: capacity } = useApi(getCapacitySummary);

  const [returnDate, setReturnDate] = useState('');
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState label="Loading equipment…" />;
  if (error) return <ErrorState message={error} />;
  if (!equipment) return null;

  const unavailable = equipment.status !== 'available';
  const typeBaseline = capacity?.type_baselines?.find((b) => b.equipment_type === equipment.type);

  async function handleRent(event) {
    event.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      await checkOut({
        equipment_id: equipment.id,
        customer_name: customerName,
        expected_return_at: returnDate ? new Date(returnDate).toISOString() : undefined,
      });
      navigate('/customer/rentals');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="equipment-detail">
      <Link to="/customer" className="back-link">
        ← Back to search
      </Link>

      <div className="equipment-detail-layout">
        <EquipmentImage type={equipment.type} />

        <div className="equipment-detail-body">
          <p className="entry-eyebrow">{equipment.type}</p>
          <h1>{equipment.code}</h1>
          {equipment.home_site && <p className="page-subtitle">Located at {equipment.home_site.code}</p>}

          {typeBaseline && (
            <p className="capacity-fit-hint">
              Typical {equipment.type.toLowerCase()} rentals here log about {typeBaseline.typical_total_hours}h of
              productive work in total (based on {typeBaseline.sample_count} comparable past rentals), against an
              assumed {typeBaseline.assumed_capacity_hours}h/day of capacity — a useful reference point when
              deciding how long to book this for.
            </p>
          )}

          {unavailable ? (
            <p className="form-error">This machine is currently {equipment.status.replace('_', ' ')} — check back later.</p>
          ) : (
            <form onSubmit={handleRent} className="checkout-form equipment-rent-form">
              <p className="equipment-rent-as">
                Renting as <strong>{customerName}</strong> — your signed-in Google account.
              </p>
              <label>
                Needed until (optional)
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </label>
              {formError && <p className="form-error">{formError}</p>}
              <button type="submit" disabled={busy}>
                {busy ? 'Requesting…' : 'Rent this equipment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

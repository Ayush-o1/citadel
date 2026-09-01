import * as repository from './equipment.repository.js';
import { ApiError } from '../../utils/apiResponse.js';

// Equipment.status (available/checked_out/maintenance) is the persisted
// base state; "overdue" is not stored anywhere — it's derived at read time
// from the active checkout's expected_return_at vs. now, per REQ-001.
function computeLiveStatus(row) {
  if (row.base_status === 'maintenance') return 'maintenance';
  if (!row.active_checkout_id) return 'available';
  if (row.active_expected_return_at && new Date(row.active_expected_return_at) < new Date()) {
    return 'overdue';
  }
  return 'checked_out';
}

function toEquipmentDto(row) {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    status: computeLiveStatus(row),
    home_site: row.home_site_id ? { id: row.home_site_id, code: row.home_site_code } : null,
    active_checkout: row.active_checkout_id
      ? {
          id: row.active_checkout_id,
          checked_out_at: row.active_checked_out_at,
          expected_return_at: row.active_expected_return_at,
          operator: row.active_operator_id
            ? { id: row.active_operator_id, code: row.active_operator_code }
            : null,
          site: row.active_site_id ? { id: row.active_site_id, code: row.active_site_code } : null,
        }
      : null,
    created_at: row.created_at,
  };
}

export async function listEquipment() {
  const rows = await repository.findAll();
  return rows.map(toEquipmentDto);
}

export async function getEquipmentById(id) {
  const row = await repository.findById(id);
  if (!row) throw new ApiError(404, 'Equipment not found');
  return toEquipmentDto(row);
}

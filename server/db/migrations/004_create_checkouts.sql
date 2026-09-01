-- One row per rental cycle -- the who/what/where/when backbone (REQ-005).
--
-- site_id and expected_return_at are nullable:
--   - the official sample's EQX1002/EQX1007 rows have a NULL Site ID --
--     that pattern must be representable, not fabricated away (it is the
--     official worked example for the missing-assignment anomaly, see
--     phases/PHASE-05-anomaly-detection.md).
--   - expected_return_at only applies to active checkouts; the official
--     sample rows are already-completed historical rentals with no
--     "expected return" concept, only actual checkout/check-in dates.

CREATE TABLE IF NOT EXISTS checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  operator_id UUID REFERENCES operators(id) ON DELETE RESTRICT,
  site_id UUID REFERENCES sites(id) ON DELETE RESTRICT,
  checked_out_at TIMESTAMPTZ NOT NULL,
  expected_return_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'returned', 'overdue')),
  condition_out TEXT,
  condition_in TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (checked_in_at IS NULL OR checked_in_at >= checked_out_at)
);

-- Find the current/history of checkouts for a given asset.
CREATE INDEX IF NOT EXISTS idx_checkouts_equipment_id ON checkouts (equipment_id);
-- Alerts/anomalies sweep active checkouts (overdue/upcoming-return checks).
CREATE INDEX IF NOT EXISTS idx_checkouts_status ON checkouts (status);

-- An asset can only have one active checkout at a time (REQ-018: reject
-- duplicate check-out). Enforced at the database level, not just in the
-- API, via a partial unique index.
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkouts_one_active_per_equipment
  ON checkouts (equipment_id)
  WHERE status = 'active';

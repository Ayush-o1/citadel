-- Equipment inventory. `home_site_id` is nullable: the official sample
-- only gives a per-rental Site ID (stored on checkouts.site_id below),
-- never a separate "home site" for the equipment itself.

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  home_site_id UUID REFERENCES sites(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'checked_out', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asset Dashboard lists/filters/sorts by status.
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment (status);

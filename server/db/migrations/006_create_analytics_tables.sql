-- Analytics layer: alerts, anomalies, forecasts, recommendations.
-- All plain tables computed/written by service-layer logic (Phases 04-07)
-- -- no separate analytics process or datastore. See
-- .ai/ARCHITECTURE.md's "Analytics layer" section.

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  checkout_id UUID REFERENCES checkouts(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('upcoming_return', 'overdue', 'missing_info')),
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  checkout_id UUID REFERENCES checkouts(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('excessive_idle', 'zero_runtime', 'missing_assignment', 'unusual_movement')),
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type TEXT NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  predicted_demand NUMERIC(8, 2) NOT NULL,
  method TEXT NOT NULL,
  factors TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);

-- source_id deliberately has no foreign key: it polymorphically points at
-- alerts, anomalies, or forecasts depending on source_type. Postgres has
-- no native conditional FK for this without triggers/table inheritance,
-- which would be overengineering at this scale -- referential integrity
-- for source_id is enforced in the recommendations service layer instead.
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('alert', 'anomaly', 'forecast')),
  source_id UUID NOT NULL,
  equipment_id UUID REFERENCES equipment(id) ON DELETE RESTRICT,
  signal TEXT NOT NULL,
  reason TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('return', 'reassign', 'investigate', 'extend')),
  expected_impact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actioned_at TIMESTAMPTZ
);

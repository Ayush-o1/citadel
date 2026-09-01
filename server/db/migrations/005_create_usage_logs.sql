-- Daily usage snapshot for a checkout. `logged_at` is a DATE (not a
-- timestamp): the official sample reports Engine/Idle Hours per day, and
-- every analytics phase (alerts/anomalies/forecasts) aggregates by day --
-- one row per (checkout, day) keeps that aggregation exact, with no
-- timezone-of-day noise to worry about.

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id UUID NOT NULL REFERENCES checkouts(id) ON DELETE RESTRICT,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  logged_at DATE NOT NULL,
  engine_hours NUMERIC(5, 2) NOT NULL CHECK (engine_hours >= 0),
  idle_hours NUMERIC(5, 2) NOT NULL CHECK (idle_hours >= 0),
  fuel_level NUMERIC(5, 2),
  location TEXT,
  condition_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (checkout_id, logged_at)
);

-- Utilization/anomaly/forecast computations aggregate usage_logs per checkout.
CREATE INDEX IF NOT EXISTS idx_usage_logs_checkout_id ON usage_logs (checkout_id);

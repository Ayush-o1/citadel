-- Fixes a real, reproduced race condition: alerts.service.js's
-- syncAlerts(), anomalies.service.js's syncAnomalies(), and
-- recommendations.service.js's syncRecommendations() all use a
-- check-then-act pattern (SELECT current keys, then INSERT any that
-- aren't present) with no atomicity guarantee. Two concurrent GET
-- requests hitting the sync-on-read endpoint at nearly the same time
-- (a real, common scenario -- multiple people had the Control Tower open
-- simultaneously during testing) can both see "not present yet" and
-- both insert, producing exact duplicates. Confirmed live on production
-- (2026-09-02): EQX1007 had every anomaly type inserted twice, same
-- checkout_id, detected_at ~50ms apart -- the definitive signature of
-- this exact race, not demo-data drift.
--
-- Step 1: remove existing duplicates (keeping the earliest row per key)
-- before adding the constraints below, which would otherwise fail to
-- create against data that already violates them.

DELETE FROM anomalies
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY checkout_id, type ORDER BY detected_at ASC, id ASC
    ) AS rn
    FROM anomalies
    WHERE status = 'open'
  ) ranked
  WHERE rn > 1
);

DELETE FROM alerts
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY checkout_id, type ORDER BY created_at ASC, id ASC
    ) AS rn
    FROM alerts
    WHERE status = 'open'
  ) ranked
  WHERE rn > 1
);

DELETE FROM recommendations
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY source_type, source_id ORDER BY created_at ASC, id ASC
    ) AS rn
    FROM recommendations
  ) ranked
  WHERE rn > 1
);

-- Step 2: make the race structurally impossible instead of just cleaning
-- up after it. At most one *open* anomaly/alert per (checkout, type) --
-- resolved ones are excluded from the index so history isn't
-- constrained, only the live/current state is. Recommendations' natural
-- key (source_type, source_id) is unique regardless of status, matching
-- the service layer's own "insert-once" intent.

CREATE UNIQUE INDEX IF NOT EXISTS idx_anomalies_one_open_per_checkout_type
  ON anomalies (checkout_id, type)
  WHERE status = 'open';

CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_one_open_per_checkout_type
  ON alerts (checkout_id, type)
  WHERE status = 'open';

CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendations_one_per_source
  ON recommendations (source_type, source_id);

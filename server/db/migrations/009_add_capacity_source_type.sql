-- Extends recommendations.source_type for the capacity-aware rental
-- optimization signal (RB-6, see .ai/FRONTEND-REBUILD-PLAN.md section 4).
-- No new table: a capacity signal is keyed by its checkout_id, which is
-- already a stable UUID, so recommendations.source_id reuses it directly
-- (same "no FK, integrity enforced in the service layer" pattern as the
-- other three source types -- see migration 006's comment).

ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_source_type_check;
ALTER TABLE recommendations ADD CONSTRAINT recommendations_source_type_check
  CHECK (source_type IN ('alert', 'anomaly', 'forecast', 'capacity'));

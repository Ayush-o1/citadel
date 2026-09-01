-- `items` was a disposable reference pattern (see .ai/ARCHITECTURE.md),
-- not a real feature. Real domain tables now exist and serve as the live
-- example of the same pattern -- see .ai/DECISIONS.md's 2026-09-01 "Phase
-- 01: delete the items reference module" entry.

DROP TABLE IF EXISTS items;

-- Minimal customer identity for the Customer role experience.
--
-- The schema has no customer/user accounts (deliberately out of scope --
-- see .ai/DECISIONS.md "no authentication/multi-user roles", 2026-08-30).
-- Rather than build a full accounts system, checkouts can now optionally
-- carry a free-text customer name so "my rentals" (Customer POV) queries
-- real data instead of being fully mocked. Nullable: dealer-initiated
-- checkouts (internal fleet use) never set this. See
-- .ai/FRONTEND-REBUILD-PLAN.md section 3.

ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS customer_name TEXT;

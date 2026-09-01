// Shared healthy time-utilization band (RESEARCH.md R-002): 65-75% engine
// hours vs. total logged hours. Used by utilization.service.js (fleet-wide
// view) and capacity.service.js (per-rental baseline) — extracted here so
// the two can't silently drift apart, since they're the same threshold by
// definition, not two independent ones that happen to match today.
export const HEALTHY_MIN = 0.65;
export const HEALTHY_MAX = 0.75;

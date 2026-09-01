// REQ-020 (stretch): a rule-driven, one-line natural-language summary of
// the Action Queue's top item — plain string templating over data the
// Action Queue already computed and ranked, not a new AI dependency or a
// second source of truth. If the ranking or wording changes upstream
// (Phase 07), this sentence changes with it automatically.
const ACTION_PHRASES = {
  return: 'return it',
  reassign: 'reassign or return it',
  investigate: 'investigate it',
  extend: 'extend or pre-position stock',
};

export function summarizeTopSignal(item) {
  if (!item) return null;
  const actionPhrase = ACTION_PHRASES[item.action] ?? 'take action';
  return `Top priority — ${item.signal}. Recommended: ${actionPhrase}.`;
}

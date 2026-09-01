// The component the differentiation strategy hinges on (DESIGN.md) —
// signal, reason, action, expected impact, reading like a sentence a
// human wrote, not a raw data dump.
const ACTION_LABELS = {
  return: 'Mark returned',
  reassign: 'Mark reassigned',
  investigate: 'Mark investigated',
  extend: 'Mark extended',
};

const TONE_BY_SOURCE = {
  alert: 'danger',
  anomaly: 'warning',
  forecast: 'info',
};

export default function ActionQueueItem({ item, onAction, busy }) {
  const tone = TONE_BY_SOURCE[item.source_type] ?? 'neutral';

  return (
    <li className={`action-item action-item-${tone}`}>
      <div className="action-item-body">
        <p className="action-item-signal">{item.signal}</p>
        <p className="action-item-reason">{item.reason}</p>
        <p className="action-item-impact">{item.expected_impact}</p>
      </div>
      <div className="action-item-actions">
        <button type="button" disabled={busy} onClick={() => onAction(item.id, 'actioned')}>
          {busy ? 'Working…' : ACTION_LABELS[item.action] ?? 'Mark actioned'}
        </button>
        <button
          type="button"
          className="action-item-dismiss"
          disabled={busy}
          onClick={() => onAction(item.id, 'dismissed')}
        >
          Dismiss
        </button>
      </div>
    </li>
  );
}

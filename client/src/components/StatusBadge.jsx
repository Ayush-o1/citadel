// One definition of what each status/tone means, reused everywhere an
// asset or signal's state is shown (DESIGN.md's fixed status vocabulary:
// neutral/info = normal, amber = attention, red = urgent).
const TONE_BY_STATUS = {
  available: 'neutral',
  checked_out: 'info',
  overdue: 'danger',
  maintenance: 'warning',
  returned: 'neutral',
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

const LABEL_BY_STATUS = {
  available: 'Available',
  checked_out: 'Checked out',
  overdue: 'Overdue',
  maintenance: 'Maintenance',
  returned: 'Returned',
};

export default function StatusBadge({ status }) {
  const tone = TONE_BY_STATUS[status] ?? 'neutral';
  const label = LABEL_BY_STATUS[status] ?? status;
  return <span className={`status-badge status-badge-${tone}`}>{label}</span>;
}

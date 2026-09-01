// No external image assets shipped for this demo — a clean labeled
// placeholder (type + a simple silhouette) rather than a broken image or
// generic stock photo. See .ai/FRONTEND-UX-PLAN.md "Images".
const INITIAL_BY_TYPE = {
  Excavator: 'EX',
  Bulldozer: 'BD',
  Crane: 'CR',
  Grader: 'GR',
};

export default function EquipmentImage({ type }) {
  const initials = INITIAL_BY_TYPE[type] || type?.slice(0, 2).toUpperCase() || '—';
  return (
    <div className="equipment-image" aria-hidden="true">
      <span className="equipment-image-mark">{initials}</span>
    </div>
  );
}

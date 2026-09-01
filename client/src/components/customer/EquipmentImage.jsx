import EquipmentSilhouette from './EquipmentSilhouette.jsx';

// Real per-type line-art (see EquipmentSilhouette.jsx) with a text-mark
// fallback for any type the illustration set doesn't cover — never a
// broken image, never a generic/random stock photo.
const INITIAL_BY_TYPE = {
  Excavator: 'EX',
  Bulldozer: 'BD',
  Crane: 'CR',
  Grader: 'GR',
};

export default function EquipmentImage({ type }) {
  const hasIllustration = type in INITIAL_BY_TYPE;
  const initials = INITIAL_BY_TYPE[type] || type?.slice(0, 2).toUpperCase() || '—';

  return (
    <div className="equipment-image" aria-hidden="true">
      {hasIllustration ? (
        <EquipmentSilhouette type={type} className="equipment-silhouette" />
      ) : (
        <span className="equipment-image-mark">{initials}</span>
      )}
    </div>
  );
}

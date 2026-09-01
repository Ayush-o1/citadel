// Real per-type equipment photos (client/public/equipment/) with a
// text-mark fallback for any type the photo set doesn't cover — never a
// broken image, never a generic/random stock photo.
const PHOTO_BY_TYPE = {
  Excavator: '/equipment/excavator.jpg',
  Bulldozer: '/equipment/bulldozer.webp',
  Crane: '/equipment/crane.jpg',
  Grader: '/equipment/grader.jpg',
};

const INITIAL_BY_TYPE = {
  Excavator: 'EX',
  Bulldozer: 'BD',
  Crane: 'CR',
  Grader: 'GR',
};

export default function EquipmentImage({ type }) {
  const photo = PHOTO_BY_TYPE[type];
  const initials = INITIAL_BY_TYPE[type] || type?.slice(0, 2).toUpperCase() || '—';

  return (
    <div className="equipment-image">
      {photo ? (
        <img src={photo} alt={type} className="equipment-photo" loading="lazy" />
      ) : (
        <span className="equipment-image-mark" aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  );
}

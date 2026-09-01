// Intentional line-art silhouettes, not photography — this app ships with
// no licensed equipment photos and won't substitute stock/AI imagery that
// isn't genuinely CAT/dealer equipment (see .ai/FRONTEND-UX-PLAN.md
// "Images"). Each type gets its own recognizable profile instead of a
// generic placeholder, drawn in the same single-accent industrial
// language as the rest of the UI (one stroke color, no gradients/fills
// beyond the ground line).

function Excavator(props) {
  return (
    <svg viewBox="0 0 160 100" fill="none" {...props}>
      <line x1="8" y1="82" x2="152" y2="82" className="silhouette-ground" />
      <rect x="20" y="64" width="70" height="18" rx="3" className="silhouette-line" />
      <circle cx="34" cy="86" r="7" className="silhouette-line" />
      <circle cx="50" cy="86" r="7" className="silhouette-line" />
      <circle cx="66" cy="86" r="7" className="silhouette-line" />
      <circle cx="80" cy="86" r="7" className="silhouette-line" />
      <path d="M40 64 L40 40 L70 40 L70 64 Z" className="silhouette-line" />
      <path d="M44 40 L58 26" className="silhouette-line" />
      <path d="M40 46 L28 32" className="silhouette-line" />
      <path d="M60 44 L100 20" className="silhouette-line" strokeWidth="4" />
      <path d="M100 20 L128 44" className="silhouette-line" strokeWidth="4" />
      <path d="M128 44 L118 62 L138 66 L146 48 Z" className="silhouette-line" />
    </svg>
  );
}

function Bulldozer(props) {
  return (
    <svg viewBox="0 0 160 100" fill="none" {...props}>
      <line x1="8" y1="82" x2="152" y2="82" className="silhouette-ground" />
      <rect x="34" y="76" width="88" height="10" rx="3" className="silhouette-line" />
      <rect x="40" y="46" width="34" height="30" rx="2" className="silhouette-line" />
      <path d="M50 46 L58 34 L70 34 L70 46" className="silhouette-line" />
      <path d="M20 40 L20 76 L34 76 L34 46 Z" className="silhouette-line" strokeWidth="4" />
      <path d="M8 40 L20 40" className="silhouette-line" strokeWidth="4" />
      <path d="M74 62 L128 62" className="silhouette-line" strokeWidth="3" />
      <circle cx="52" cy="86" r="9" className="silhouette-line" />
      <circle cx="94" cy="86" r="9" className="silhouette-line" />
    </svg>
  );
}

function Crane(props) {
  return (
    <svg viewBox="0 0 160 100" fill="none" {...props}>
      <line x1="8" y1="82" x2="152" y2="82" className="silhouette-ground" />
      <rect x="54" y="66" width="30" height="16" rx="2" className="silhouette-line" />
      <circle cx="60" cy="86" r="6" className="silhouette-line" />
      <circle cx="78" cy="86" r="6" className="silhouette-line" />
      <path d="M69 66 L69 14" className="silhouette-line" strokeWidth="4" />
      <path d="M69 18 L140 30" className="silhouette-line" strokeWidth="3" />
      <path d="M69 30 L58 66" className="silhouette-line" />
      <path d="M132 30 L132 54" className="silhouette-line" strokeDasharray="3 3" />
      <path d="M126 54 L138 54" className="silhouette-line" />
    </svg>
  );
}

function Grader(props) {
  return (
    <svg viewBox="0 0 160 100" fill="none" {...props}>
      <line x1="8" y1="82" x2="152" y2="82" className="silhouette-ground" />
      <path d="M24 68 L136 68" className="silhouette-line" strokeWidth="3" />
      <rect x="64" y="42" width="30" height="26" rx="2" className="silhouette-line" />
      <path d="M70 42 L78 30 L90 30 L90 42" className="silhouette-line" />
      <path d="M40 68 L40 78 L58 78 L52 68 Z" className="silhouette-line" strokeWidth="3" />
      <circle cx="34" cy="86" r="10" className="silhouette-line" />
      <circle cx="124" cy="86" r="10" className="silhouette-line" />
      <path d="M94 60 L136 60" className="silhouette-line" />
    </svg>
  );
}

const SILHOUETTE_BY_TYPE = {
  Excavator,
  Bulldozer,
  Crane,
  Grader,
};

export default function EquipmentSilhouette({ type, className }) {
  const Icon = SILHOUETTE_BY_TYPE[type];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}

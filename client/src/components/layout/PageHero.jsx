// Compact per-role landing banner — reused at the top of each role's
// primary page (Customer Discover, Dealer/Admin Control Tower) so every
// workspace opens with its own photographic identity, not a bare <h1>.
export default function PageHero({ eyebrow, title, subtitle, photo }) {
  return (
    <div className="page-hero">
      <img src={photo} alt="" className="page-hero-photo" loading="eager" />
      <div className="page-hero-scrim" />
      <div className="page-hero-content">
        {eyebrow && <p className="page-hero-eyebrow">{eyebrow}</p>}
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

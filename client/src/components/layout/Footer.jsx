const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span className="entry-wordmark site-footer-wordmark">CITADEL</span>
          <p className="site-footer-tagline">Smart Rental Tracking — from checkout to return.</p>
        </div>

        <div className="site-footer-cols">
          <div className="site-footer-col">
            <h4>Workspaces</h4>
            <ul>
              <li>Customer discovery &amp; rentals</li>
              <li>Dealer control tower</li>
              <li>Caterpillar fleet admin</li>
            </ul>
          </div>
          <div className="site-footer-col">
            <h4>How it works</h4>
            <ul>
              <li>Spot — live status, alerts, anomalies</li>
              <li>Explain — plain-language reasons</li>
              <li>Act — one ranked recommendation queue</li>
            </ul>
          </div>
          <div className="site-footer-col">
            <h4>Project</h4>
            <ul>
              <li>
                <a href="https://github.com/Ayush-o1/citadel" target="_blank" rel="noreferrer noopener">
                  Source on GitHub
                </a>
              </li>
              <li>Built for the Caterpillar campus hackathon</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="site-footer-legal">
        <span>© {YEAR} Citadel. A hackathon prototype — not affiliated with Caterpillar Inc.</span>
      </div>
    </footer>
  );
}

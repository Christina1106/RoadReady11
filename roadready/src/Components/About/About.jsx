import { Link } from "react-router-dom";
import "./About.css";

export default function About() {
  return (
    <div className="about">
      {/* HERO */}
      <section className="about-hero">
        <div className="container about-hero__grid">
          <div className="about-hero__copy">
            <div className="about-hero__logo">🏁</div>
            <h1 className="about-title">About RoadReady</h1>
            <p className="about-lead">
              We’re on a mission to make car rental simple, fair, and fast.
              Clear pricing. Real availability. Support that actually helps.
            </p>
            <div className="about-cta">
              <Link to="/cars" className="btn btn--primary">Browse cars</Link>
              <Link to="/dashboard/customer" className="btn btn--ghost">My Area</Link>
            </div>
          </div>

          {/* Right: stat tiles */}
          <ul className="about-stats" aria-label="RoadReady at a glance">
            <li><span className="big">250+</span><span className="muted">cars in fleet</span></li>
            <li><span className="big">98%</span><span className="muted">on-time pickups</span></li>
            <li><span className="big">24/7</span><span className="muted">customer support</span></li>
          </ul>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="about-block">
        <div className="container">
          <h2 className="section__title">How we work</h2>
          <div className="grid grid--3">
            <Card icon="🔍" title="Transparent pricing">
              No hidden fees. See taxes and charges up front before you book.
            </Card>
            <Card icon="⚡" title="Frictionless booking">
              Real-time availability, instant confirmation, easy changes.
            </Card>
            <Card icon="🛠️" title="Well-maintained fleet">
              Regular maintenance and safety checks on every vehicle.
            </Card>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="about-block light">
        <div className="container">
          <h2 className="section__title">Our values</h2>
          <div className="grid grid--3">
            <Value title="Customers first">We optimize for your time and peace of mind.</Value>
            <Value title="Own the outcome">We fix issues quickly and learn from them.</Value>
            <Value title="Keep it simple">Fewer steps, clearer choices, better results.</Value>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-final">
        <div className="container about-cta-final__bar">
          <div>
            <h3>Ready to hit the road?</h3>
            <p className="muted">Pick dates, compare cars, and book in seconds.</p>
          </div>
          <Link to="/cars" className="btn btn--primary">Find a car</Link>
        </div>
      </section>

      {/* SHARED DARK FOOTER (same class across pages) */}
      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div>
            <h3 className="footer-brand">🚗 RoadReady</h3>
            <p className="muted">
              Your journey, your car, your way. Premium car rentals at unbeatable prices.
            </p>
          </div>

          <div>
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/cars">Our Fleet</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Legal</h4>
            <ul className="footer-links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="container site-footer__bottom">
          © {new Date().getFullYear()} RoadReady. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

/* tiny helpers */
function Card({ icon, title, children }) {
  return (
    <article className="card about-card">
      <div className="about-card__icon">{icon}</div>
      <h3 className="about-card__title">{title}</h3>
      <p className="muted">{children}</p>
    </article>
  );
}
function Value({ title, children }) {
  return (
    <article className="card about-value">
      <h3 className="about-value__title">{title}</h3>
      <p className="muted">{children}</p>
    </article>
  );
}

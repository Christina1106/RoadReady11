import { Link } from "react-router-dom";
import "./Contact.css";

export default function Contact() {
  return (
    <div className="c-wrap">
      {/* HERO */}
      <section className="c-hero">
        <div className="c-hero-inner">
          <div className="c-badge">Support</div>
          <h1>Contact us</h1>
          <p>
            We’re here to help with bookings, billing, fleet questions and everything in between.
          </p>
          <div className="c-hero-cta">
            <Link to="/cars" className="btn btn--primary">Browse cars</Link>
            <Link to="/about" className="btn btn--ghost">About us</Link>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <div className="c-container c-grid">
        {/* LEFT: ABOUT + TERMS/POLICIES */}
        <section className="c-card">
          <header className="c-card-head">
            <h2>About RoadReady</h2>
            <p className="muted">
              RoadReady is your trusted car-rental partner. We offer premium cars at unbeatable prices,
              with real-time availability, instant confirmation and flexible bookings. Your journey, your car, your way.
            </p>
          </header>

          <div className="c-legal">
            <article>
              <h3>Rental eligibility</h3>
              <ul className="bullets">
                <li>Drivers must be 21+ with a valid government license.</li>
                <li>Additional drivers must be added to the booking.</li>
                <li>A refundable security deposit may be required at pickup.</li>
              </ul>
            </article>

            <article>
              <h3>Booking & cancellations</h3>
              <ul className="bullets">
                <li>Free cancellation up to 24 hours before pickup.</li>
                <li>Late cancellations or no-shows may incur a fee.</li>
                <li>Date/time or vehicle changes depend on availability.</li>
              </ul>
            </article>

            <article>
              <h3>Payment & refunds</h3>
              <ul className="bullets">
                <li>All major cards accepted at time of booking.</li>
                <li>Refunds are processed to the original payment method.</li>
                <li>Fuel, tolls, tickets and fines are billed separately.</li>
              </ul>
            </article>

            <article>
              <h3>Insurance & liability</h3>
              <ul className="bullets">
                <li>Basic coverage is included with every rental.</li>
                <li>Deductibles apply; optional add-ons available.</li>
                <li>Report incidents within 24 hours of occurrence.</li>
              </ul>
            </article>
          </div>

          {/* FAQs */}
          <div className="c-faq">
            <details>
              <summary>How do I cancel or change a booking?</summary>
              <p>
                Open <strong>My Area → My Bookings</strong>, choose your booking, then use
                <em> Cancel</em> or <em> Change</em>.
              </p>
            </details>
            <details>
              <summary>What’s your refund policy?</summary>
              <p>
                Cancellations made 24+ hours before pickup are typically refunded in full.
                Check your booking confirmation for specifics.
              </p>
            </details>
          </div>
        </section>

        {/* RIGHT: INFO CARDS */}
        <aside className="c-stack">
          <article className="c-card c-info">
            <h3>Head office</h3>
            <p>123 Main Street<br />Your City, 10001</p>
            <p className="muted">Mon–Fri · 9:00–18:00</p>
          </article>

          <article className="c-card c-info">
            <h3>Talk to us</h3>
            <p><a href="tel:+11234567890">+1 (123) 456-7890</a></p>
            <p><a href="mailto:support@roadready.example">support@roadready.example</a></p>
          </article>

          <article className="c-card c-map">
            <h3>Nearest branch</h3>
            <div className="map-frame">
              <iframe
                title="Map to nearest branch"
                src="https://www.google.com/maps?q=Times+Square,New+York&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </article>

          <article className="c-card c-kpis">
            <div>
              <div className="kpi">24/7</div>
              <div className="muted">Support</div>
            </div>
            <div>
              <div className="kpi">4.8★</div>
              <div className="muted">Avg. rating</div>
            </div>
            <div>
              <div className="kpi">150+</div>
              <div className="muted">Vehicles</div>
            </div>
          </article>
        </aside>
      </div>

      {/* DARK FOOTER (page-local; optional if you already have a global footer) */}
      <section className="contact-footer">
        <div className="container contact-footer__grid">
          <div>
            <h3 className="footer-brand">🚗 RoadReady</h3>
            <p className="muted">
              Your journey, your car, your way. Premium car rentals at unbeatable prices.
            </p>
          </div>

          <div>
            <h4 className="footer-title">Quick Links</h4>
            <ul className="links footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/cars">Our Fleet</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Legal</h4>
            <ul className="links footer-links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="container contact-footer__bottom">
          © {new Date().getFullYear()} RoadReady. All rights reserved.
        </div>
      </section>
    </div>
  );
}


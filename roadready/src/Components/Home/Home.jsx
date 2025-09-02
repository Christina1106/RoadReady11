import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../Interceptors/AuthInterceptor";
import "./Home.css";
import { srcForCar } from "../../utils/carImages";

export default function Home() {
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    let mounted = true;
    api
      .get("Cars")
      .then((res) => {
        const list = (res.data || []).slice(0, 3).map((c) => ({
          id: c.carId || c.id,
          title: `${c.brandName || ""} ${c.model || ""}`.trim() || "Car",
          price: c.pricePerDay ?? c.dailyRate ?? 0,
          year: c.year,
          fuel: c.fuelType || "—",
          trans: c.transmission || "—",
          img: srcForCar(c),
        }));
        if (mounted) setPopular(list.length ? list : getStaticPopular());
      })
      .catch(() => mounted && setPopular(getStaticPopular()));
    return () => (mounted = false);
  }, []);

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <div className="hero__logo">◎</div>
            <h1 className="hero__title">RoadReady</h1>
            <p className="hero__lead">
              Rent smarter. Drive sooner. Transparent pricing and a wide fleet
              you can trust.
            </p>

            <div className="hero__cta">
              <Link className="btn btn--primary" to="/dashboard/customer">
                Go to Dashboard
              </Link>
              <Link className="btn btn--ghost" to="/cars">
                Browse cars →
              </Link>
            </div>

            <ul className="hero__bullets">
              <li>• No hidden fees</li>
              <li>• Free cancellations*</li>
              <li>• 24/7 support</li>
            </ul>
          </div>

          <div className="hero__art" aria-hidden="true">
            <img
              className="hero__img"
              src="/images/hero/bmw-m3.jpg"
              alt="BMW M3 Sedan"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="container">
          <h2 className="section__title">Why choose RoadReady?</h2>

          <div className="grid grid--3">
            <Feature
              icon="🚗"
              title="Wide Fleet"
              text="From compact hatchbacks to family SUVs & EVs—pick the perfect ride for your trip."
            />
            <Feature
              icon="💳"
              title="Transparent Pricing"
              text="What you see is what you pay. Taxes and fees shown up-front—no surprises."
            />
            <Feature
              icon="⚡"
              title="Fast Booking"
              text="Reserve in seconds, manage anytime. Changes and cancellations are effortless."
            />
          </div>
        </div>
      </section>

      {/* POPULAR */}
      <section className="popular">
        <div className="container">
          <div className="popular__head">
            <h2 className="section__title">Popular picks</h2>
            <Link className="link" to="/cars">
              See all cars
            </Link>
          </div>

          <div className="grid grid--3">
            {popular.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="how">
        <div className="container">
          <h2 className="section__title">How it works</h2>
          <ol className="steps">
            <li>
              <span className="step__num">1</span>
              <div className="step__body">
                <h3>Choose your car</h3>
                <p>Filter by size, fuel, and transmission to find the perfect match.</p>
              </div>
            </li>
            <li>
              <span className="step__num">2</span>
              <div className="step__body">
                <h3>Pick dates & location</h3>
                <p>Select pickup & drop-off—see real availability and all fees up-front.</p>
              </div>
            </li>
            <li>
              <span className="step__num">3</span>
              <div className="step__body">
                <h3>Book in seconds</h3>
                <p>Secure checkout and instant confirmation to your inbox.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="cta">
        <div className="container cta__bar">
          <div>
            <h3>Ready to hit the road?</h3>
            <p className="muted">
              Create your account or jump straight in if you already have one.
            </p>
          </div>
          <Link className="btn btn--primary" to="/dashboard/customer">
            Open Dashboard
          </Link>
        </div>
      </section>

      {/* DARK FOOTER (separate from CTA) */}
      <section className="home-footer">
        <div className="container home-footer__grid">
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

        <div className="container home-footer__bottom">
          © {new Date().getFullYear()} RoadReady. All rights reserved.
        </div>
      </section>
    </div>
  );
}

/* ——— Helpers & small comps ——— */

function Feature({ icon, title, text }) {
  return (
    <article className="card feature">
      <div className="feature__icon">{icon}</div>
      <h3 className="feature__title">{title}</h3>
      <p className="muted">{text}</p>
    </article>
  );
}

function CarCard({ car }) {
  return (
    <article className="card car">
      <div className="car__media">
        <img src={car.img} alt={car.title} loading="lazy" decoding="async" />
      </div>
      <div className="car__body">
        <div className="car__title">{car.title}</div>
        <div className="car__meta">
          {car.year ? `${car.year} • ` : ""}{car.fuel} • {car.trans}
        </div>
        <div className="car__row">
          <div className="car__price">
            {car.price ? (
              <>
                <span className="money">
                  {Number(car.price).toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                  })}
                </span>
                <span className="muted"> /day</span>
              </>
            ) : (
              <span className="muted">Ask for quote</span>
            )}
          </div>
          <Link className="btn btn--ghost btn--sm" to="/cars">
            Book now
          </Link>
        </div>
      </div>
    </article>
  );
}

function getStaticPopular() {
  return [
    { id: "p1", title: "Toyota Corolla", price: 68, year: 2022, fuel: "Petrol", trans: "Automatic", img: "/images/cars/toyota-corolla.png" },
    { id: "p2", title: "Honda (Petrol)", price: 59, year: 2023, fuel: "Petrol", trans: "Manual", img: "/images/cars/Honda1.png" },
    { id: "p3", title: "Ford EV", price: 82, year: 2024, fuel: "Electric", trans: "Automatic", img: "/images/cars/Ford-3.png" },
  ];
}

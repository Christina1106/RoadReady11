import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // <— add Link here
import api from "../../Interceptors/AuthInterceptor";
import "./Cars.css";

// --- small helpers (brand → local fallback)
const brandImage = (c) => {
  const brand = (c.brandName || "").toLowerCase();
  const transmission = (c.transmission || "").toLowerCase();
  const fuel = (c.fuelType || "").toLowerCase();

  if (brand === "toyota" && transmission === "manual") return "/images/Cars/Toyotamanual.png";
  if (brand === "toyota") return "/images/Cars/Toyota.png";
  if (brand === "honda" && transmission === "manual") return "/images/Cars/Hondamanual.png";
  if (brand === "honda" && fuel === "petrol") return "/images/Cars/HondaPetrol.png";
  if (brand === "ford") return "/images/Cars/Ford.png";
  return "";
};
const safeImageUrl = (c) => {
  const url = c.imageUrl || "";
  return !url || url.includes("example.com") ? brandImage(c) : url;
};
const money = (n) =>
  typeof n === "number" ? n.toLocaleString(undefined, { style: "currency", currency: "USD" }) : n;

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  // simple UX filters
  const [q, setQ] = useState("");
  const [fuel, setFuel] = useState("all");
  const [seats, setSeats] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get("Cars")
      .then((res) => {
        const cleaned = (res.data || []).map((c) => ({
          ...c,
          imageUrl: !c?.imageUrl || c.imageUrl.includes("example.com") ? undefined : c.imageUrl,
        }));
        if (alive) setCars(cleaned);
      })
      .catch(() => alive && setCars([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...cars];
    if (q.trim()) {
      const k = q.toLowerCase();
      list = list.filter(
        (c) =>
          (c.brandName || "").toLowerCase().includes(k) ||
          (c.model || "").toLowerCase().includes(k) ||
          (c.type || "").toLowerCase().includes(k)
      );
    }
    if (fuel !== "all") list = list.filter((c) => (c.fuelType || "").toLowerCase() === fuel);
    if (seats !== "all") list = list.filter((c) => String(c.seats || "") === String(seats));
    return list;
  }, [cars, q, fuel, seats]);

  return (
    <div className="cars-page">
      <div className="maxw">
        <header className="cars-hero">
          <h1>Browse cars</h1>
          <p>Find the perfect ride. Clear prices, instant booking.</p>
          <div className="filters">
            <input
              className="input"
              placeholder="Search (brand, model, type)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="input" value={fuel} onChange={(e) => setFuel(e.target.value)}>
              <option value="all">Fuel (all)</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <select className="input" value={seats} onChange={(e) => setSeats(e.target.value)}>
              <option value="all">Seats (all)</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="7">7</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="card skeleton" key={i}>
                <div className="media"></div>
                <div className="line"></div>
                <div className="line small"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">No cars match that filter.</div>
        ) : (
          <div className="grid">
            {filtered.map((c) => {
              const imgSrc = safeImageUrl(c) || brandImage(c);
              const unavailable =
                c.available === false || (c.status || "").toLowerCase() === "rented";

              return (
                <article className={`card ${unavailable ? "dim" : ""}`} key={c.carId || `${c.brandName}-${c.model}`}>
                  <div className="media">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={`${c.brandName} ${c.model}`}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const fb = brandImage(c);
                          if (fb && e.currentTarget.src.indexOf(fb) === -1)
                            e.currentTarget.src = fb;
                        }}
                      />
                    ) : (
                      <div className="media-fallback">Image coming soon</div>
                    )}
                  </div>
                  <div className="body">
                    <div className="title">
                      {c.brandName} {c.model}
                    </div>
                    <div className="sub">
                      {(c.year || "—")} • {(c.fuelType || "—")} • {(c.transmission || "—")}
                    </div>

                    <div className="row">
                      <div className="price">{money(c.pricePerDay || c.dailyRate)}/day</div>
                      <span className={`badge ${unavailable ? "muted" : "ok"}`}>
                        {unavailable ? "Unavailable" : "Available"}
                      </span>
                    </div>

                    <div className="meta">
                      <span>📍 {c.locationName || c.location || "Branch"}</span>
                      <span>🪑 {c.seats || "—"} seats</span>
                    </div>

                    <button
                      className="btn"
                      disabled={unavailable}
                      onClick={() => navigate("/dashboard/customer")}
                    >
                      {unavailable ? "Not available" : "Book Now"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* SHARED DARK FOOTER (same as other pages) */}
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

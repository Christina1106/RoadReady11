import { useEffect, useMemo, useState } from "react";
import "./AgentDashboard.css";
import api from "../../Interceptors/AuthInterceptor";

/* ---------------- helpers ---------------- */
const money = (n) =>
  Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const safeStr = (x) => (x == null ? "" : String(x));

/* ---------------- small UI bits ---------------- */
const Tab = ({ k, label, active, onClick }) => (
  <button
    className={`ad-tab ${active ? "active" : ""}`}
    onClick={() => onClick(k)}
    aria-pressed={active}
  >
    {label}
  </button>
);

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="ad-modal-backdrop" onClick={onClose}>
      <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ad-modal-head">
          <div className="ad-modal-title">{title}</div>
          <button className="ad-icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="ad-modal-body">{children}</div>
        {footer && <div className="ad-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- component ---------------- */
export default function AgentDashboard() {
  const uStr = sessionStorage.getItem("user");
  const user = uStr ? JSON.parse(uStr) : null;

  // tabs left: cars | issues (bookings removed)
  const [tab, setTab] = useState("cars");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // cars
  const [cars, setCars] = useState([]);

  // issues (booking issues + maintenance requests — read-only)
  const [issues, setIssues] = useState([]);

  // add car modal
  const [carOpen, setCarOpen] = useState(false);
  const [carForm, setCarForm] = useState({
    brandName: "",
    model: "",
    year: "",
    fuelType: "Petrol",
    dailyRate: "",
    imageUrl: "",
    isAvailable: true,
  });

  // maintenance modal
  const [maintOpen, setMaintOpen] = useState(false);
  const [maintForm, setMaintForm] = useState({ carId: "", issueDescription: "" });

  // small refresh trigger for reloading the current tab when needed
  const [refreshKey, setRefreshKey] = useState(0);

  /* ---------- load data per tab ---------- */
  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        if (tab === "cars") {
          const r = await api.get("Cars");
          if (!dead) setCars(r.data || []);
        }
        if (tab === "issues") {
          const [bi, mr] = await Promise.allSettled([
            api.get("BookingIssues"),
            api.get("MaintenanceRequests/open"),
          ]);
          const list = [];
          if (bi.status === "fulfilled") {
            (bi.value.data || []).forEach((i) =>
              list.push({
                id: i.issueId ?? i.bookingIssueId ?? i.id,
                type: "booking",
                carId: i.carId ?? null,
                bookingId: i.bookingId,
                description: i.description,
                status: i.status ?? "Open",
                priority: i.priority ?? "Medium",
                assignedTo: i.assignedTo ?? null,
                createdAt: i.createdAt ?? new Date().toISOString(),
              })
            );
          }
          if (mr.status === "fulfilled") {
            (mr.value.data || []).forEach((m) =>
              list.push({
                id: m.requestId ?? m.maintenanceRequestId ?? m.id,
                type: "maintenance",
                carId: m.carId,
                bookingId: m.bookingId ?? null,
                description: m.issueDescription ?? m.description ?? "Maintenance request",
                status: m.isResolved ? "Resolved" : m.status ?? "Open",
                priority: m.priority ?? "Medium",
                assignedTo: m.assignedTo ?? null,
                createdAt: m.reportedDate ?? m.createdAt ?? new Date().toISOString(),
              })
            );
          }
          if (!dead) setIssues(list);
        }
      } catch (e) {
        console.error(e);
        if (!dead) setErr(e?.response?.data?.message || "Failed to load data.");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [tab, refreshKey]); // refreshKey forces reload after actions

  /* ---------- car actions ---------- */
  const toggleCarAvailability = async (car) => {
    try {
      setLoading(true); setErr("");
      await api.put(`Cars/${car.carId}`, { ...car, isAvailable: !car.isAvailable });
      setCars((prev) =>
        prev.map((c) => (c.carId === car.carId ? { ...c, isAvailable: !car.isAvailable } : c))
      );
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Could not update car availability.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateCar = () => {
    setCarForm({
      brandName: "",
      model: "",
      year: "",
      fuelType: "Petrol",
      dailyRate: "",
      imageUrl: "",
      isAvailable: true,
    });
    setCarOpen(true);
  };

  const saveCar = async () => {
    const f = carForm;
    if (!f.brandName || !f.model || !f.year || !f.dailyRate) {
      alert("Brand, Model, Year and Rate are required.");
      return;
    }
    try {
      setLoading(true); setErr("");
      const payload = {
        brandName: f.brandName,
        model: f.model,
        year: Number(f.year),
        fuelType: f.fuelType,
        pricePerDay: Number(f.dailyRate),
        imageUrl: f.imageUrl || null,
        isAvailable: !!f.isAvailable,
      };
      await api.post("Cars", payload);
      setCarOpen(false);
      const r = await api.get("Cars");
      setCars(r.data || []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Could not add car.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- maintenance actions ---------- */
  const openMaintenance = async () => {
    setMaintForm({ carId: "", issueDescription: "" });
    setMaintOpen(true);
    // make sure cars are available for the dropdown
    if (!cars.length) {
      try { const r = await api.get("Cars"); setCars(r.data || []); } catch {}
    }
  };

  const saveMaintenance = async () => {
    const { carId, issueDescription } = maintForm;
    if (!carId || !issueDescription.trim()) {
      alert("Please select a car and describe the issue.");
      return;
    }
    try {
      setLoading(true); setErr("");
      await api.post("MaintenanceRequests", {
        carId: Number(carId),
        issueDescription: issueDescription.trim(),
      });
      setMaintOpen(false);
      // switch to issues tab and refresh to show the new item
      setTab("issues");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Could not create maintenance request.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- greeting ---------- */
  const greeting = useMemo(() => {
    const name = user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user?.email || "Agent";
    return `Welcome, ${name}`;
  }, [user]);

  /* ---------- render ---------- */
  return (
    <div className="ad-wrap">
      {/* Header */}
      <header className="ad-header">
        <div className="brand">
          <span className="dot" aria-hidden>🏁</span>
          <div>
            <div className="brand-name">RoadReady</div>
            <div className="brand-sub">Agent Portal</div>
          </div>
        </div>
        <div className="header-right">
          <span className="welcome">{greeting}</span>
          <button
            className="ad-btn ad-btn--ghost"
            onClick={() => {
              sessionStorage.clear();
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs (bookings removed) */}
      <nav className="ad-tabs">
        <Tab k="cars" label="Fleet Management" active={tab === "cars"} onClick={setTab} />
        <Tab k="issues" label="Issues & Maintenance" active={tab === "issues"} onClick={setTab} />
      </nav>

      {/* Content */}
      <main className="ad-main">
        {err && <div className="ad-alert">{safeStr(err)}</div>}
        {loading && <div className="ad-loading">Loading…</div>}

        {/* CARS */}
        {tab === "cars" && (
          <section>
            <div className="ad-section-head">
              <h2 className="ad-section-title">Fleet Management</h2>
              <div className="ad-row ad-gap">
                <button className="ad-btn ad-btn--outline" onClick={() => setRefreshKey(k => k + 1)}>
                  Refresh
                </button>
                <button className="ad-btn ad-btn--primary" onClick={openCreateCar}>
                  Add New Car
                </button>
              </div>
            </div>

            {!cars.length ? (
              <div className="ad-empty">No cars found.</div>
            ) : (
              <div className="ad-grid-cars">
                {cars.map((c) => (
                  <article key={c.carId} className="ad-car-card">
                    <div className="ad-car-media">
                      <img
                        className="ad-car-img"
                        src={c.imageUrl || "/images/cars/placeholder.png"}
                        alt={`${c.brandName || c.brand || ""} ${c.model || c.modelName || ""}`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/cars/placeholder.png";
                        }}
                      />
                    </div>
                    <div className="ad-car-body">
                      <div className="ad-car-title">
                        {(c.brandName || c.brand || "")} {(c.model || c.modelName || "")}
                      </div>
                      <div className="ad-muted ad-small">
                        {c.year || "—"} • {c.fuelType || "—"}
                      </div>
                      <div className="ad-row ad-between">
                        <div className="ad-price">{money(c.pricePerDay || c.dailyRate)}/day</div>
                        <span className={`ad-chip ${c.isAvailable ? "ok" : "bad"}`}>
                          {c.isAvailable ? "Available" : "Rented"}
                        </span>
                      </div>
                      <div className="ad-row ad-gap">
                        <button
                          className="ad-btn ad-btn--ghost"
                          onClick={() => alert("Edit car can be wired later")}
                        >
                          Edit
                        </button>
                        <button
                          className="ad-btn ad-btn--outline"
                          onClick={() => toggleCarAvailability(c)}
                        >
                          {c.isAvailable ? "Mark Unavailable" : "Mark Available"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ISSUES */}
        {tab === "issues" && (
          <section>
            <div className="ad-section-head">
              <h2 className="ad-section-title">Issues & Maintenance</h2>
              <div className="ad-row ad-gap">
                <button className="ad-btn ad-btn--outline" onClick={() => setRefreshKey(k => k + 1)}>
                  Refresh
                </button>
                <button className="ad-btn ad-btn--primary" onClick={openMaintenance}>
                  Report Maintenance
                </button>
              </div>
            </div>

            {!issues.length ? (
              <div className="ad-empty">No issues reported.</div>
            ) : (
              <div className="ad-cards">
                {issues.map((i) => (
                  <article key={i.id} className="ad-card">
                    <div className="ad-card-main">
                      <div className="ad-grow">
                        <div className="ad-card-title">
                          {(i.type || "Issue").toString().replace(/^\w/, (s) => s.toUpperCase())}
                        </div>
                        <div className="ad-muted">
                          {i.carId ? `Car #${i.carId}` : "—"}
                          {i.bookingId ? ` • Booking #${i.bookingId}` : ""}
                        </div>
                        <div className="ad-desc">{i.description || "—"}</div>
                        <div className="ad-muted ad-small">
                          Reported: {new Date(i.createdAt || Date.now()).toLocaleDateString()}
                          {i.assignedTo ? ` • Assigned to: ${i.assignedTo}` : ""}
                        </div>
                      </div>
                      <div className="ad-stack-right">
                        <span className="ad-chip">{i.priority || "Medium"} priority</span>
                        <span
                          className={`ad-chip status-${String(i.status).toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {i.status || "Open"}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Add Car */}
      <Modal
        open={carOpen}
        title="Add New Car"
        onClose={() => setCarOpen(false)}
        footer={
          <>
            <button className="ad-btn ad-btn--ghost" onClick={() => setCarOpen(false)}>Cancel</button>
            <button className="ad-btn ad-btn--primary" onClick={saveCar} disabled={loading}>
              {loading ? "Saving…" : "Save Car"}
            </button>
          </>
        }
      >
        <div className="ad-form ad-form--cols">
          <label className="ad-field">
            <span>Brand</span>
            <input
              value={carForm.brandName}
              onChange={(e) => setCarForm((f) => ({ ...f, brandName: e.target.value }))}
              placeholder="BMW"
            />
          </label>
          <label className="ad-field">
            <span>Model</span>
            <input
              value={carForm.model}
              onChange={(e) => setCarForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="M340i"
            />
          </label>
          <label className="ad-field">
            <span>Year</span>
            <input
              type="number"
              value={carForm.year}
              onChange={(e) => setCarForm((f) => ({ ...f, year: e.target.value }))}
              placeholder="2024"
            />
          </label>
          <label className="ad-field">
            <span>Fuel Type</span>
            <select
              value={carForm.fuelType}
              onChange={(e) => setCarForm((f) => ({ ...f, fuelType: e.target.value }))}
            >
              <option>Petrol</option>
              <option>Diesel</option>
              <option>Electric</option>
              <option>Hybrid</option>
            </select>
          </label>
          <label className="ad-field">
            <span>Daily Rate (USD)</span>
            <input
              type="number"
              value={carForm.dailyRate}
              onChange={(e) => setCarForm((f) => ({ ...f, dailyRate: e.target.value }))}
              placeholder="350"
            />
          </label>
          <label className="ad-field ad-col-span-2">
            <span>Image URL</span>
            <input
              value={carForm.imageUrl}
              onChange={(e) => setCarForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://…"
            />
          </label>
          <label className="ad-field">
            <span>Available</span>
            <select
              value={carForm.isAvailable ? "1" : "0"}
              onChange={(e) =>
                setCarForm((f) => ({ ...f, isAvailable: e.target.value === "1" }))
              }
            >
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </label>
        </div>
      </Modal>

      {/* Report Maintenance */}
      <Modal
        open={maintOpen}
        title="Report Maintenance"
        onClose={() => setMaintOpen(false)}
        footer={
          <>
            <button className="ad-btn ad-btn--ghost" onClick={() => setMaintOpen(false)}>
              Cancel
            </button>
            <button className="ad-btn ad-btn--primary" onClick={saveMaintenance} disabled={loading}>
              {loading ? "Submitting…" : "Submit"}
            </button>
          </>
        }
      >
        <div className="ad-form">
          <label className="ad-field">
            <span>Car</span>
            <select
              value={maintForm.carId}
              onChange={(e) => setMaintForm((f) => ({ ...f, carId: e.target.value }))}
            >
              <option value="">Select a car…</option>
              {cars.map((c) => (
                <option key={c.carId} value={c.carId}>
                  {(c.brandName || c.brand || "") + " " + (c.model || c.modelName || "")}
                  {c.year ? ` (${c.year})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="ad-field">
            <span>Issue description</span>
            <textarea
              rows={4}
              value={maintForm.issueDescription}
              onChange={(e) =>
                setMaintForm((f) => ({ ...f, issueDescription: e.target.value }))
              }
              placeholder="e.g., Oil leak noticed, warning light on…"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

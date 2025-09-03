// src/Components/Dashboards/AgentDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import "./AgentDashboard.css";
import api from "../../Interceptors/AuthInterceptor";

/* ---------------- fallbacks ---------------- */
const STATUS_FALLBACKS = [
  { statusId: 1, statusName: "Available"    },
  { statusId: 2, statusName: "Rented"       },
  { statusId: 3, statusName: "Maintenance"  },
  { statusId: 4, statusName: "Unavailable"  },
];

/* ---------------- helpers ---------------- */
const money = (n) =>
  Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const safeStr = (x) => (x == null ? "" : String(x));

const normCar = (raw) => ({
  carId: raw.carId ?? raw.id,
  brandId: raw.brandId ?? raw.brand?.brandId,
  brandName: raw.brandName ?? raw.brand?.brandName ?? raw.brand ?? "",
  modelName: raw.modelName ?? raw.model ?? "",
  year: raw.year ?? raw.Year ?? "",
  fuelType: raw.fuelType ?? raw.FuelType ?? "Petrol",
  transmission: raw.transmission ?? raw.Transmission ?? "Automatic",
  seats: raw.seats ?? raw.Seats ?? 5,
  dailyRate: raw.dailyRate ?? raw.pricePerDay ?? raw.DailyRate ?? 0,
  statusId: raw.statusId ?? raw.status?.statusId,
  statusName: raw.statusName ?? raw.status?.statusName ?? raw.status ?? "",
  imageUrl: raw.imageUrl ?? raw.imageURL ?? raw.image ?? "/images/cars/logo.png",
});

/* ---------------- small UI bits ---------------- */
const Tab = ({ k, label, active, onClick }) => (
  <button className={`ad-tab ${active ? "active" : ""}`} onClick={() => onClick(k)} aria-pressed={active}>
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

  // tabs: cars | issues
  const [tab, setTab] = useState("cars");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // data
  const [cars, setCars] = useState([]);
  const [brands, setBrands] = useState([]);      // kept in case you show brand filters later
  const [statuses, setStatuses] = useState([]);
  const [issues, setIssues] = useState([]);

  // maintenance modal only (add-car removed)
  const [maintOpen, setMaintOpen] = useState(false);
  const [maintForm, setMaintForm] = useState({ carId: "", issueDescription: "" });

  // refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  /* ---------- loaders ---------- */
  const loadCars = async () => {
    const r = await api.get("Cars");
    setCars((r.data || []).map(normCar));
  };

  const loadBrands = async () => {
    try {
      const r = await api.get("CarBrands").catch(() => api.get("Brands"));
      setBrands(r.data || []);
    } catch {
      setBrands([]);
    }
  };

  const loadStatuses = async () => {
    try {
      const r = await api.get("CarStatuses").catch(() => ({ data: [] }));
      const list = r.data && r.data.length ? r.data : STATUS_FALLBACKS;
      setStatuses(list);
    } catch {
      setStatuses(STATUS_FALLBACKS);
    }
  };

  // derive brands from cars if brand endpoint empty
  useEffect(() => {
    if (!brands.length && cars.length) {
      const uniq = [
        ...new Map(
          cars
            .filter((c) => c.brandId || c.brandName)
            .map((c) => [c.brandId ?? c.brandName, { brandId: c.brandId, brandName: c.brandName }])
        ).values(),
      ];
      if (uniq.length) setBrands(uniq);
    }
  }, [brands.length, cars]);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        if (tab === "cars") {
          await Promise.all([loadCars(), loadBrands(), loadStatuses()]);
        } else if (tab === "issues") {
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
  }, [tab, refreshKey]);

  /* ---------- status helpers ---------- */
  const statusIdByName = (name) => {
    const key = (name || "").toLowerCase();
    const hit = statuses.find((s) => (s.statusName || "").toLowerCase() === key);
    if (hit?.statusId != null) return Number(hit.statusId);
    const fall = STATUS_FALLBACKS.find((s) => (s.statusName || "").toLowerCase() === key);
    return fall?.statusId ?? 1;
  };

  const nextToggleStatusId = (car) => {
    const name = (car.statusName || car.status || "").toLowerCase();
    // Toggle Available <-> Unavailable by default
    if (name.includes("avail")) return statusIdByName("Unavailable");
    return statusIdByName("Available");
  };

  /* ---------- car actions (no add) ---------- */
  const toggleCarAvailability = async (car) => {
    try {
      setLoading(true); setErr("");
      const desired = nextToggleStatusId(car);
      try {
        await api.patch(`Cars/${car.carId}/status`, { statusId: Number(desired) });
      } catch {
        await api.put(`Cars/${car.carId}`, { ...car, statusId: Number(desired) });
      }
      const nextName =
        (statuses.find((s) => Number(s.statusId) === Number(desired))?.statusName) ||
        (STATUS_FALLBACKS.find((s) => s.statusId === desired)?.statusName) ||
        "Available";
      setCars((prev) =>
        prev.map((c) =>
          c.carId === car.carId ? { ...c, statusId: desired, statusName: nextName } : c
        )
      );
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Could not update car status.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- maintenance actions ---------- */
  const openMaintenance = async () => {
    setMaintForm({ carId: "", issueDescription: "" });
    setMaintOpen(true);
    if (!cars.length) {
      try { const r = await api.get("Cars"); setCars((r.data || []).map(normCar)); } catch {}
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

      {/* Tabs */}
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
                <button className="ad-btn ad-btn--outline" onClick={() => setRefreshKey(k => k + 1)}>Refresh</button>
                {/* "Add New Car" removed */}
              </div>
            </div>

            {!cars.length ? (
              <div className="ad-empty">No cars found.</div>
            ) : (
              <div className="ad-grid-cars">
                {cars.map((c) => {
                  const statusText =
                    c.statusName ||
                    (c.isAvailable === true ? "Available" :
                      c.isAvailable === false ? "Unavailable" : "—");
                  const isOk = /available/i.test(statusText);
                  return (
                    <article key={c.carId} className="ad-car-card">
                      <div className="ad-car-media">
                        <img
                          className="ad-car-img"
                          src={c.imageUrl || "/images/cars/logo.png"}
                          alt={`${c.brandName} ${c.modelName}`}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/cars/logo.png";
                          }}
                        />
                      </div>
                      <div className="ad-car-body">
                        <div className="ad-car-title">
                          {(c.brandName || "")} {(c.modelName || "")}
                        </div>
                        <div className="ad-muted ad-small">
                          {c.year || "—"} • {c.fuelType || "—"}
                        </div>
                        <div className="ad-row ad-between">
                          <div className="ad-price">{money(c.dailyRate)}/day</div>
                          <span className={`ad-chip ${isOk ? "ok" : "bad"}`}>{statusText}</span>
                        </div>
                        <div className="ad-row ad-gap">
                          <button className="ad-btn ad-btn--ghost" onClick={() => alert("Edit can be added later")}>
                            Edit
                          </button>
                          <button className="ad-btn ad-btn--outline" onClick={() => toggleCarAvailability(c)}>
                            {isOk ? "Mark Unavailable" : "Mark Available"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
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
                <button className="ad-btn ad-btn--outline" onClick={() => setRefreshKey(k => k + 1)}>Refresh</button>
                <button className="ad-btn ad-btn--primary" onClick={openMaintenance}>Report Maintenance</button>
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
                        <span className={`ad-chip status-${String(i.status).toLowerCase().replace(/\s+/g, "-")}`}>
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

      {/* Report Maintenance modal only */}
      <Modal
        open={maintOpen}
        title="Report Maintenance"
        onClose={() => setMaintOpen(false)}
        footer={
          <>
            <button className="ad-btn ad-btn--ghost" onClick={() => setMaintOpen(false)}>Cancel</button>
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
                  {(c.brandName || "") + " " + (c.modelName || "")}
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
              onChange={(e) => setMaintForm((f) => ({ ...f, issueDescription: e.target.value }))}
              placeholder="e.g., Oil leak noticed, warning light on…"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

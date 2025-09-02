// src/Components/Dashboards/CustomerDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import "./CustomerDashboard.css";
import BookingModal from "../Booking/BookingModal";
import {
  getBrands,
  getCars,
  searchCars as searchCarsApi,
  getMyBookings,
  getMyIssues,
  getAllIssues,
  cancelBooking as cancelBookingApi,
  createIssue,
  createReview,
} from "../../services/customer.service";
import { normalizeCar, normalizeBooking } from "../../Modals/mappers";
import { srcForCar, FALLBACK_IMG, carAlt } from "../../utils/carImages";
import StarRating from "../common/StarRating";

/* ---------- tiny utilities ---------- */
const money = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "—";
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
};

const fmtDT = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getUserFromSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};
const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const decodeJwtPayload = (t) => {
  try {
    const base = t.split(".")[1];
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    // eslint-disable-next-line no-undef
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
};
const getMyUserId = (user) => {
  const possible =
    user?.userId ??
    user?.id ??
    user?.Id ??
    user?.UserId ??
    user?.userID ??
    null;
  if (possible != null) return String(possible);
  const claims = decodeJwtPayload(getToken()) || {};
  return (
    String(claims.uid ?? claims.nameid ?? claims.nameId ?? claims.sub ?? "") ||
    null
  );
};

/* ---------- date conversions ---------- */
// Input: yyyy-MM-dd (or dd-MM-yyyy) -> ISO UTC with default time
const dayToIsoZ = (yyyyMmDd, hour = 10, minute = 0) => {
  if (!yyyyMmDd) return "";
  let y, m, d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) {
    [y, m, d] = yyyyMmDd.split("-").map(Number);
  } else {
    const m2 = yyyyMmDd.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m2) return "";
    d = Number(m2[1]);
    m = Number(m2[2]);
    y = Number(m2[3]);
  }
  const local = new Date(y, m - 1, d, hour, minute, 0);
  const utc = new Date(
    Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), hour, minute, 0)
  );
  return utc.toISOString();
};

/* ================================================================================== */
/*                                   MODALS                                           */
/* ================================================================================== */

function ReportIssueModal({ open, booking, onClose, onCreated }) {
  const [type, setType] = useState("Vehicle");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setType("Vehicle");
      setText("");
      setSaving(false);
    }
  }, [open]);
  if (!open) return null;

  const submit = async () => {
    if (!text.trim()) return alert("Please describe the issue.");
    try {
      setSaving(true);
      const { data } = await createIssue({
        bookingId: booking.bookingId,
        issueType: type,
        description: text,
      });
      onCreated?.(data);
      onClose();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e.message || "Failed to submit issue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cd-modal-backdrop" onClick={onClose}>
      <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cd-modal-head">
          <div className="cd-modal-title">
            Report an issue for Booking #{booking?.bookingId}
          </div>
          <button className="cd-icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="cd-grid">
          <div className="cd-field">
            <label className="cd-label">Type</label>
            <select
              className="cd-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {["Vehicle", "Pickup", "Dropoff", "Payment", "Other"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="cd-field">
          <label className="cd-label">Description</label>
          <textarea
            className="cd-input"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <button className="cd-btn-primary w-100" onClick={submit} disabled={saving}>
          {saving ? "Submitting…" : "Submit issue"}
        </button>
      </div>
    </div>
  );
}

function ReviewModal({ open, booking, onClose, onCreated }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!open) {
      setRating(5);
      setComment("");
      setSaving(false);
      setAvailable(true);
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    try {
      setSaving(true);
      const { data } = await createReview({
        bookingId: booking.bookingId,
        rating,
        comment,
      });
      onCreated?.(data);
      onClose();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) {
        setAvailable(false);
        alert("Reviews are not enabled on this server.");
      } else {
        console.error(e);
        alert(e?.response?.data?.message || e.message || "Failed to submit review");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cd-modal-backdrop" onClick={onClose}>
      <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cd-modal-head">
          <div className="cd-modal-title">
            Rate your trip • Booking #{booking?.bookingId}
          </div>
          <button className="cd-icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {available ? (
          <>
            <div className="cd-grid">
              <div className="cd-field">
                <label className="cd-label">Rating</label>
                <StarRating value={rating} onChange={setRating} size={22} />
              </div>
            </div>
            <div className="cd-field">
              <label className="cd-label">Comment (optional)</label>
              <textarea
                className="cd-input"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <button className="cd-btn-primary w-100" onClick={submit} disabled={saving}>
              {saving ? "Submitting…" : "Submit review"}
            </button>
          </>
        ) : (
          <div className="cd-empty">Reviews aren’t enabled on this server.</div>
        )}
      </div>
    </div>
  );
}

/* ================================================================================== */
/*                                MAIN DASHBOARD                                      */
/* ================================================================================== */

export default function CustomerDashboard() {
  const user = useMemo(getUserFromSession, []);
  const myUserId = useMemo(() => getMyUserId(user), [user]);

  const [active, setActive] = useState("browse");

  // cars/brands/filters
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [brands, setBrands] = useState([]);

  const [fromDate, setFromDate] = useState(""); // yyyy-MM-dd
  const [toDate, setToDate] = useState("");
  const [brandId, setBrandId] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [minSeats, setMinSeats] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // bookings / issues
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  /* ---------- initial brands ---------- */
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const r = await getBrands();
        setBrands(r.data || []);
      } catch {
        setBrands([]);
      }
    };
    loadBrands();
  }, []);

  /* ---------- tab switches ---------- */
  useEffect(() => {
    if (active === "browse") {
      setCarsLoading(true);
      getCars()
        .then((res) => {
          const list = (res.data || []).map(normalizeCar);
          setCars(list);
          if (!brands.length) {
            const uniq = [
              ...new Map(
                list.map((c) => [
                  c.brandId,
                  { brandId: c.brandId, brandName: c.brandName },
                ])
              ).values(),
            ];
            setBrands(uniq);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setCarsLoading(false));
    }

    if (active === "bookings") {
      setBookingsLoading(true);
      getMyBookings()
        .then((res) => {
          const list = (res.data || []).map(normalizeBooking);
          setBookings(list.sort((a, b) => (b.bookingId ?? 0) - (a.bookingId ?? 0)));
        })
        .catch((err) => {
          console.error(err);
          setBookings([]);
        })
        .finally(() => setBookingsLoading(false));
    }

    if (active === "issues") {
      setIssuesLoading(true);
      getMyIssues()
        .then((res) => setIssues(res.data || []))
        .catch(async (err) => {
          if (err?.response?.status === 404) {
            try {
              const res2 = await getAllIssues();
              const all = res2.data || [];
              const mine = all.filter((i) => String(i.userId) === String(myUserId));
              setIssues(mine);
            } catch (e) {
              console.error(e);
              setIssues([]);
            }
          } else {
            console.error(err);
            setIssues([]);
          }
        })
        .finally(() => setIssuesLoading(false));
    }
  }, [active, myUserId, brands.length]);

  /* ---------- actions ---------- */
  const searchCars = async () => {
    if (!fromDate || !toDate) {
      alert("Select pickup/return dates to search availability.");
      return;
    }
    const body = {
      fromUtc: dayToIsoZ(fromDate, 10, 0),
      toUtc: dayToIsoZ(toDate, 10, 0),
      brandId: brandId ? Number(brandId) : undefined,
      fuelType: fuelType || undefined,
      transmission: transmission || undefined,
      minSeats: minSeats ? Number(minSeats) : undefined,
      maxDailyRate: maxPrice ? Number(maxPrice) : undefined,
    };
    try {
      setCarsLoading(true);
      const { data } = await searchCarsApi(body);
      setCars((data || []).map(normalizeCar));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e.message || "Search failed");
    } finally {
      setCarsLoading(false);
    }
  };

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setBrandId("");
    setFuelType("");
    setTransmission("");
    setMinSeats("");
    setMaxPrice("");
    setActive("browse"); // reloads
  };

  const startBooking = (car) => {
    setSelectedCar(car);
    setModalOpen(true);
  };
  const onBooked = (created) => {
    setBookings((prev) =>
      Array.isArray(prev) ? [created, ...prev] : [created]
    );
    setActive("bookings");
  };

  const canCancel = (b) => {
    const status = String(b.statusName || b.status || "").toLowerCase().trim();
    if (status === "pending") return true; // always cancellable
    if (status !== "confirmed") return false;
    const pickupIso =
      b.pickupDateTimeUtc || b.startDate || b.pickupDateTime || b.pickup;
    const t = pickupIso ? Date.parse(pickupIso) : NaN;
    return Number.isFinite(t) ? t >= Date.now() : true;
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await cancelBookingApi(id);
      setBookings((prev) =>
        prev.map((x) =>
          x.bookingId === id ? { ...x, statusName: "Cancelled" } : x
        )
      );
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e.message || "Cancel failed");
    }
  };

  const openIssue = (b) => {
    setSelectedBooking(b);
    setIssueModalOpen(true);
  };
  const addIssueLocal = (issue) => setIssues((prev) => [issue, ...(prev || [])]);

  const openReview = (b) => {
    setSelectedBooking(b);
    setReviewModalOpen(true);
  };

  const canReview = (b) => {
    const pastDropoff =
      new Date(b.dropoffDateTimeUtc) < new Date();
    const alreadyReviewed = Boolean(b.hasReview || b.reviewId);
    return pastDropoff && !alreadyReviewed;
  };

  const logout = () => {
    sessionStorage.clear();
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  /* ---------- UI ---------- */
  return (
    <div className="cd-wrap">
      {/* Header */}
      <header className="cd-header">
        <div className="cd-header-left">
          <div className="cd-brand">
            <div className="cd-brand-icon">🏁</div>
            <div className="cd-brand-text">
              <div className="cd-brand-title">RoadReady</div>
              <div className="cd-brand-sub">Customer Portal</div>
            </div>
          </div>
        </div>
        <div className="cd-header-right">
          <span className="cd-welcome">
            Welcome,{" "}
            {user?.firstName
              ? `${user.firstName} ${user.lastName || ""}`
              : "Customer"}
          </span>
          <button className="cd-btn-outline" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="cd-tabs">
        {[
          { key: "browse", label: "Browse Cars" },
          { key: "bookings", label: "My Bookings" },
          { key: "issues", label: "My Issues" },
          { key: "profile", label: "Profile" },
        ].map((t) => (
          <button
            key={t.key}
            className={`cd-tab ${active === t.key ? "active" : ""}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="cd-main">
        {/* BROWSE */}
        {active === "browse" && (
          <>
            <h2 className="cd-section-title">Find your car</h2>

            {/* Filters */}
            <div className="cd-filters">
              <div className="cd-field">
                <label className="cd-label">Pickup</label>
                <input
                  type="date"
                  className="cd-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="cd-field">
                <label className="cd-label">Return</label>
                <input
                  type="date"
                  className="cd-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="cd-field">
                <label className="cd-label">Brand</label>
                <select
                  className="cd-input"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  <option value="">Any</option>
                  {brands.map((b) => (
                    <option key={b.brandId} value={b.brandId}>
                      {b.brandName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cd-field">
                <label className="cd-label">Fuel</label>
                <select
                  className="cd-input"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                >
                  <option value="">Any</option>
                  {["Petrol", "Diesel", "Hybrid", "Electric"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="cd-field">
                <label className="cd-label">Transmission</label>
                <select
                  className="cd-input"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                >
                  <option value="">Any</option>
                  {["Automatic", "Manual"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="cd-field">
                <label className="cd-label">Min seats</label>
                <input
                  className="cd-input"
                  type="number"
                  min="2"
                  max="9"
                  value={minSeats}
                  onChange={(e) => setMinSeats(e.target.value)}
                />
              </div>
              <div className="cd-field">
                <label className="cd-label">Max price/day</label>
                <input
                  className="cd-input"
                  type="number"
                  min="1"
                  step="1"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              <div className="cd-filter-actions">
                <button className="cd-btn-ghost" onClick={resetFilters}>
                  Reset
                </button>
                <button
                  className="cd-btn-primary"
                  onClick={searchCars}
                  disabled={carsLoading || !fromDate || !toDate}
                >
                  {carsLoading ? "Searching…" : "Search availability"}
                </button>
              </div>
            </div>

            {/* Results */}
            {carsLoading ? (
              <div className="cd-empty">Loading cars…</div>
            ) : cars.length === 0 ? (
              <div className="cd-empty">No cars match your filters.</div>
            ) : (
              <div className="cd-grid-cars">
                {cars.map((raw) => {
                  // normalize fields from API
                  const c = {
                    ...raw,
                    model: raw.model ?? raw.modelName ?? "",
                    brandName:
                      raw.brandName ?? raw.brand?.brandName ?? raw.brand ?? "",
                    dailyRate:
                      raw.dailyRate ?? raw.DailyRate ?? raw.pricePerDay ?? 0,
                    seats: raw.seats ?? raw.Seats ?? "—",
                    fuelType: raw.fuelType ?? raw.FuelType ?? "—",
                    transmission: raw.transmission ?? raw.Transmission ?? "—",
                    year: raw.year ?? raw.Year ?? "—",
                    locationName: raw.locationName ?? raw.location ?? "Branch",

                    // Ratings (robust fallbacks, no stray 'review' variable)
                    avgRating: Number(
                      raw.avgRating ??
                        raw.averageRating ??
                        raw.rating ??
                        raw.avg_rate ??
                        0
                    ),
                    reviewsCount: Number(
                      raw.reviewsCount ??
                        raw.reviewCount ??
                        raw.reviews ??
                        raw.totalReviews ??
                        0
                    ),
                  };

                  return (
                    <article key={c.carId} className="cd-car">
                      <div className="cd-car-media">
                        <img
                          src={srcForCar(c)}
                          alt={carAlt(c)}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_IMG;
                          }}
                        />
                      </div>

                      <div className="cd-car-body">
                        <div className="cd-car-title">
                          {c.brandName} {c.model}
                        </div>
                        <div className="cd-car-sub">
                          {c.year} • {c.fuelType} • {c.transmission}
                        </div>

                        {/* Price */}
                        <div className="cd-car-row">
                          <div className="cd-car-price">
                            {money(c.dailyRate)}/day
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="cd-car-meta">
                          <div>📍 {c.locationName}</div>
                          <div>🪑 {c.seats} seats</div>
                        </div>

                        {/* Ratings */}
                        <div className="cd-stars">
                          {c.avgRating > 0 ? (
                            <>
                              <StarRating value={c.avgRating} readOnly size={16} />
                              <small>({Number(c.reviewsCount) || 0})</small>
                            </>
                          ) : (
                            <small className="muted">No ratings yet</small>
                          )}
                        </div>

                        <button
                          className="cd-btn-primary w-100"
                          onClick={() => startBooking(c)}
                        >
                          Book now
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* BOOKINGS */}
        {active === "bookings" && (
          <>
            <h2 className="cd-section-title">My bookings</h2>
            {bookingsLoading ? (
              <div className="cd-empty">Loading bookings…</div>
            ) : bookings.length === 0 ? (
              <div className="cd-empty">No bookings yet.</div>
            ) : (
              <div className="cd-list">
                {bookings.map((b) => (
                  <div className="cd-card-row" key={b.bookingId}>
                    <div className="cd-row-left">
                      <div className="cd-row-title">Booking #{b.bookingId}</div>
                      <div className="cd-row-sub">{b.carName || "Car"}</div>
                      <div className="cd-row-meta">
                        {fmtDT(b.pickupDateTimeUtc)} → {fmtDT(b.dropoffDateTimeUtc)} •
                        {" "}Pickup: {b.pickupLocationName || "—"} • Dropoff:{" "}
                        {b.dropoffLocationName || "—"}
                      </div>
                    </div>
                    <div className="cd-row-right">
                      <div className="cd-price">{money(b.totalAmount)}</div>
                      <span className={`cd-badge ${String(b.statusName || "").toLowerCase()}`}>
                        {b.statusName || "—"}
                      </span>
                      <div className="cd-row-actions">
                        <button
                          className="cd-btn-ghost"
                          disabled={!canCancel(b)}
                          title={
                            !canCancel(b)
                              ? "Pick-up time has passed or status not cancellable"
                              : ""
                          }
                          onClick={() => cancelBooking(b.bookingId)}
                        >
                          Cancel
                        </button>
                        <button className="cd-btn-ghost" onClick={() => openIssue(b)}>
                          Report issue
                        </button>
                        {canReview(b) && (
                          <button className="cd-btn-ghost" onClick={() => openReview(b)}>
                            Leave review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ISSUES */}
        {active === "issues" && (
          <>
            <h2 className="cd-section-title">My issues</h2>
            {issuesLoading ? (
              <div className="cd-empty">Loading issues…</div>
            ) : issues.length === 0 ? (
              <div className="cd-empty">No issues reported yet.</div>
            ) : (
              <div className="cd-list">
                {issues.map((i) => (
                  <div className="cd-card-row" key={i.bookingIssueId || i.id}>
                    <div className="cd-row-left">
                      <div className="cd-row-title">
                        {(i.issueType || "Issue").toString()}
                      </div>
                      <div className="cd-row-sub">Booking #{i.bookingId}</div>
                      <div className="cd-row-meta">{i.description}</div>
                    </div>
                    <div className="cd-row-right">
                      <span className={`cd-badge ${String(i.status).toLowerCase()}`}>
                        {i.status}
                      </span>
                      {i.priority && (
                        <span
                          className={`cd-chip ${String(i.priority).toLowerCase()}`}
                        >
                          {i.priority} priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PROFILE */}
        {active === "profile" && (
          <>
            <h2 className="cd-section-title">Profile</h2>
            <div className="cd-profile">
              <div className="cd-field readonly">
                <label>Name</label>
                <div>
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName || ""}`
                    : "—"}
                </div>
              </div>
              <div className="cd-field readonly">
                <label>Email</label>
                <div>{user?.email || "—"}</div>
              </div>
              <div className="cd-field readonly">
                <label>Phone</label>
                <div>{user?.phoneNumber || "Not provided"}</div>
              </div>
              <div className="cd-field readonly">
                <label>Role</label>
                <div>{user?.roleName || user?.role || "Customer"}</div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <BookingModal
        open={modalOpen}
        car={selectedCar}
        onClose={() => setModalOpen(false)}
        onBooked={onBooked}
        defaultFrom={fromDate}
        defaultTo={toDate}
      />
      <ReportIssueModal
        open={issueModalOpen}
        booking={selectedBooking}
        onClose={() => setIssueModalOpen(false)}
        onCreated={addIssueLocal}
      />
      <ReviewModal
        open={reviewModalOpen}
        booking={selectedBooking}
        onClose={() => setReviewModalOpen(false)}
      />
    </div>
  );
}

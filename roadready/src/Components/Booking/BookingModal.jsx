// src/Components/Booking/BookingModal.jsx
import { useEffect, useState, useMemo } from "react";
import "./booking-modal.css";
import { getLocations, getQuote, createBooking } from "../../services/customer.service";
import { normalizeLocation } from "../../Modals/mappers";

// tiny helpers
const money = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "—";
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
};
const dayToIsoZ = (yyyyMmDd, hour = 10, minute = 0) => {
  if (!yyyyMmDd) return "";
  let y, m, d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) [y, m, d] = yyyyMmDd.split("-").map(Number);
  else {
    const m2 = yyyyMmDd.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m2) return "";
    d = Number(m2[1]); m = Number(m2[2]); y = Number(m2[3]);
  }
  const local = new Date(y, m - 1, d, hour, minute, 0);
  const utc = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), hour, minute, 0));
  return utc.toISOString();
};

function QuoteRow({ label, value, strong }) {
  return (
    <div className="cd-quote-row">
      <span>{label}</span>
      <span className={strong ? "cd-quote-strong" : ""}>{value}</span>
    </div>
  );
}

export default function BookingModal({ open, car, onClose, onBooked, defaultFrom, defaultTo }) {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [locations, setLocations] = useState([]);
  const [pickupLocId, setPickupLocId] = useState("");
  const [dropoffLocId, setDropoffLocId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);

  const disabled = useMemo(
    () => !pickup || !dropoff || !pickupLocId || !dropoffLocId,
    [pickup, dropoff, pickupLocId, dropoffLocId]
  );

  useEffect(() => {
    if (!open) {
      setPickup(""); setDropoff("");
      setPickupLocId(""); setDropoffLocId("");
      setSubmitting(false); setQuote(null);
      return;
    }
    if (defaultFrom) setPickup(defaultFrom);
    if (defaultTo) setDropoff(defaultTo);

    getLocations()
      .then((r) => (r?.data || []).map(normalizeLocation))
      .then(setLocations)
      .catch(() => setLocations([]));
  }, [open, defaultFrom, defaultTo]);

  const fetchQuote = async () => {
    const fromUtc = dayToIsoZ(pickup);
    const toUtc = dayToIsoZ(dropoff);
    if (!(new Date(toUtc) > new Date(fromUtc))) {
      alert("Dropoff must be after pickup");
      return;
    }
    try {
      setQuoting(true);
      const { data } = await getQuote(car.carId, fromUtc, toUtc);
      setQuote(data || null);
    } catch (e) {
      console.error(e);
      setQuote(null);
      alert(e?.message || "Could not fetch quote");
    } finally {
      setQuoting(false);
    }
  };

  const submit = async () => {
    if (disabled || !car) return;

    const pickupZ = dayToIsoZ(pickup, 10, 0);
    const dropoffZ = dayToIsoZ(dropoff, 10, 0);

    if (!(new Date(dropoffZ) > new Date(pickupZ))) {
      alert("Dropoff must be after pickup");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        carId: car.carId,
        pickupDateTimeUtc: pickupZ,
        dropoffDateTimeUtc: dropoffZ,
        pickupLocationId: Number(pickupLocId),
        dropoffLocationId: Number(dropoffLocId),
      };
      if (!quote) await fetchQuote();
      const { data } = await createBooking(payload); // ✅ no "payloads" typo
      onBooked?.(data);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  const daily = car?.dailyRate ?? car?.DailyRate ?? car?.pricePerDay;

  return (
    <div className="cd-modal-backdrop" onClick={onClose}>
      <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cd-modal-head">
          <div className="cd-modal-title">Book your rental</div>
          <button className="cd-icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="cd-modal-sub">
          {car ? `${car.brandName} ${car.model || ""} — ${money(daily)}/day` : ""}
        </div>

        <div className="cd-grid">
          <div className="cd-field">
            <label className="cd-label">Pickup date</label>
            <input type="date" className="cd-input" value={pickup}
              onChange={(e) => { setPickup(e.target.value); setQuote(null); }} />
          </div>
          <div className="cd-field">
            <label className="cd-label">Return date</label>
            <input type="date" className="cd-input" value={dropoff}
              onChange={(e) => { setDropoff(e.target.value); setQuote(null); }} />
          </div>
        </div>

        <div className="cd-grid">
          <div className="cd-field">
            <label className="cd-label">Pickup location</label>
            <select className="cd-input" value={pickupLocId} onChange={(e) => setPickupLocId(e.target.value)}>
              <option value="">Select pickup location</option>
              {locations.map((loc) => (
                <option key={loc.locationId} value={loc.locationId}>{loc.locationName}</option>
              ))}
            </select>
          </div>

          <div className="cd-field">
            <label className="cd-label">Drop-off location</label>
            <select className="cd-input" value={dropoffLocId} onChange={(e) => setDropoffLocId(e.target.value)}>
              <option value="">Select drop-off location</option>
              {locations.map((loc) => (
                <option key={loc.locationId} value={loc.locationId}>{loc.locationName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="cd-quote">
          <button className="cd-btn-ghost" onClick={fetchQuote} disabled={!pickup || !dropoff || quoting}>
            {quoting ? "Calculating…" : "Get quote"}
          </button>
          {quote && (
            <div className="cd-quote-box">
              <QuoteRow label="Days" value={quote.days} />
              <QuoteRow label="Daily rate" value={money(quote.dailyRate)} />
              <QuoteRow label="Subtotal" value={money(quote.subtotal)} />
              <QuoteRow label="Taxes" value={money(quote.taxes)} />
              <QuoteRow label="Total" value={money(quote.total)} strong />
            </div>
          )}
        </div>

        <button className="cd-btn-primary w-100" onClick={submit} disabled={submitting || disabled}>
          {submitting ? "Processing…" : "Confirm booking"}
        </button>
      </div>
    </div>
  );
}


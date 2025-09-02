import { useEffect, useMemo, useState } from "react";
import api from "../../Interceptors/AuthInterceptor";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";

// --- image helpers (place right under the imports) ---
// --- image helpers (place right under the imports) ---
const PLACEHOLDER_IMG = "/images/cars/logo.png"; // you don't have placeholder.png

// Optional brand/model based fallbacks for your local images.
const brandedFallback = (c) => {
  const brand = (c.brandName || "").toLowerCase();
  const model = (c.modelName || "").toLowerCase();

  if (brand.includes("toyota") && model.includes("corolla")) return "/images/cars/toyota-corolla.png";
  if (brand.includes("honda") && model.includes("civic"))   return "/images/cars/Honda1.png";
  if (brand.includes("ford"))                                return "/images/cars/Ford-3.png";
  if (brand.includes("honda"))                               return "/images/cars/honda2.png";
  return null;
};

// Prefer the API image if it looks like a real image URL, else fall back
const isImgUrl = (u) => !!u && /\.(png|jpe?g|webp|gif)$/i.test(u);

const safeImg = (c) => {
  const apiUrl = (c.imageUrl || c.imageURL || c.image || "").trim();
  return (isImgUrl(apiUrl) && apiUrl) || brandedFallback(c) || PLACEHOLDER_IMG;
};

/* ---------- helpers ---------- */
const money = (n) =>
  Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

const STATUSES_FALLBACK = [
  { statusId: 1, statusName: "Available" },
  { statusId: 2, statusName: "Rented" },
  { statusId: 3, statusName: "Maintenance" },
  { statusId: 4, statusName: "Unavailable" },
];

// normalize Car DTO into one shape
const normalizeCar = (raw) => ({
  carId: raw.carId ?? raw.id,
  brandId: raw.brandId ?? raw.brand?.brandId,
  brandName: raw.brandName ?? raw.brand?.brandName ?? raw.brand ?? "",
  modelName: raw.modelName ?? raw.model ?? "",
  year: raw.year ?? raw.Year ?? "",
  dailyRate: raw.dailyRate ?? raw.pricePerDay ?? raw.DailyRate ?? 0,
  seats: raw.seats ?? raw.Seats ?? 5,
  transmission: raw.transmission ?? raw.Transmission ?? "",
  fuelType: raw.fuelType ?? raw.FuelType ?? "",
  statusId: raw.statusId ?? raw.status?.statusId,
  statusName: raw.statusName ?? raw.status?.statusName ?? raw.status ?? "",
  imageUrl: raw.imageUrl ?? raw.imageURL ?? raw.image ?? "",
  description: raw.description ?? raw.Description ?? "",
});

export default function AdminFleetTab({ searchQuery = "" }) {
  const [cars, setCars] = useState([]);
  const [brands, setBrands] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [q, setQ] = useState(searchQuery || "");
  useEffect(() => setQ(searchQuery || ""), [searchQuery]);

  const [saving, setSaving] = useState(false);
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  /* ---------- loaders ---------- */
  const refreshCars = async () => {
    try {
      const res = await api.get("Cars");
      setCars((res.data || []).map(normalizeCar));
    } catch {
      setCars([]);
    }
  };

  const refreshBrands = async () => {
    try {
      const res = await api.get("CarBrands").catch(() => api.get("Brands"));
      setBrands(res.data || []);
    } catch {
      setBrands([]);
    }
  };

  // --- add below refreshBrands()
const createBrand = async (brandName) => {
  // try CarBrands first, fall back to Brands if your API uses that
  try {
    const r = await api.post("CarBrands", { brandName });
    return r.data;
  } catch {
    const r = await api.post("Brands", { brandName });
    return r.data;
  }
};

const addBrandAndRefresh = async (brandName) => {
  const created = await createBrand(brandName.trim());
  await refreshBrands();
  return created; // { brandId, brandName, ... }
};


  const refreshStatuses = async () => {
    try {
      const res = await api.get("CarStatuses").catch(() => ({ data: [] }));
      setStatuses(res.data || []);
    } catch {
      setStatuses([]);
    }
  };

  useEffect(() => {
    refreshCars();
    refreshBrands();
    refreshStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derive brands if brand API is empty
  useEffect(() => {
    if (!brands?.length && cars?.length) {
      const uniq = [
        ...new Map(
          cars
            .filter((c) => c.brandId || c.brandName)
            .map((c) => [c.brandId ?? c.brandName, { brandId: c.brandId, brandName: c.brandName }])
        ).values(),
      ];
      setBrands(uniq);
    }
  }, [cars, brands?.length]);

  // unique list of statuses (API ∪ FALLBACK ∪ derived-from-cars)
  const statusesUnique = useMemo(() => {
    const m = new Map();
    [...statuses, ...STATUSES_FALLBACK, ...cars.map(c => ({
      statusId: c.statusId, statusName: c.statusName
    }))]
      .filter(s => s && (s.statusId || s.statusName))
      .forEach(s => {
        const key = String(s.statusId ?? s.statusName);
        m.set(key, { statusId: s.statusId, statusName: s.statusName });
      });
    return [...m.values()];
  }, [statuses, cars]);

  /* ---------- actions ---------- */
  const openAddCar = () => {
    // if we truly have nothing, derive minimal lists so the modal has options
    if (!brands.length && cars.length) {
      const b = [
        ...new Map(
          cars
            .filter((c) => c.brandId || c.brandName)
            .map((c) => [c.brandId ?? c.brandName, { brandId: c.brandId, brandName: c.brandName }])
        ).values(),
      ];
      setBrands(b);
    }
    setEditingCar(null);
    setCarModalOpen(true);
  };

  const openEditCar = (car) => {
    setEditingCar(car);
    setCarModalOpen(true);
  };

  const saveCar = async (payload) => {
    try {
      setSaving(true);
      if (editingCar?.carId) {
        // UPDATE
        await api.put(`Cars/${editingCar.carId}`, payload); // camelCase accepted by your Swagger
      } else {
        // CREATE
        await api.post("Cars", payload);
      }
      await refreshCars();
      setCarModalOpen(false);
    } catch (e) {
      alert(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteCar = async (car) => {
    if (!window.confirm(`Delete ${car.brandName} ${car.modelName}?`)) return;
    try {
      await api.delete(`Cars/${car.carId}`);
      await refreshCars();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  };

  const setCarStatus = async (car, statusId) => {
    if (!statusId) return;
    try {
      await api.patch(`Cars/${car.carId}/status`, { statusId: Number(statusId) });
      await refreshCars();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to update status");
    }
  };

  /* ---------- filter ---------- */
  const filteredCars = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return cars;
    return cars.filter(
      (c) =>
        (c.brandName || "").toLowerCase().includes(term) ||
        (c.modelName || "").toLowerCase().includes(term) ||
        String(c.year || "").includes(term)
    );
  }, [cars, q]);

  return (
    <>
      <div className="row between mb16 toolbar-sticky">
        <h2 className="h2">Fleet</h2>
        <div className="row gap">
          <div className="search small">
            <Search size={16} />
            <input
              placeholder="Search cars…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={openAddCar}>
            <Plus size={16} /> Add Car
          </button>
        </div>
      </div>

      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Car</th>
              <th>Year</th>
              <th>Rate</th>
              <th>Status</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCars.map((c) => (
              <tr key={c.carId}>
                <td>
                  <div className="car-cell">
                    <div className="thumb">
  <img
    className="car-thumb"
    src={safeImg(c)}
    alt={`${c.brandName} ${c.modelName}`}
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = PLACEHOLDER_IMG;
    }}
  />
</div>


                    <div className="meta">
                      <div className="row-strong">{c.brandName} {c.modelName}</div>
                      <div className="muted small">
                        {c.fuelType || "—"} • {c.transmission || "—"} • {c.seats || "—"} seats
                      </div>
                    </div>
                  </div>
                </td>
                <td>{c.year || "—"}</td>
                <td>{money(c.dailyRate)}/day</td>
                <td>
                  <select
                    className="select"
                    value={String(c.statusId || "")}
                    onChange={(e) => setCarStatus(c, e.target.value)}
                  >
                    <option value="">—</option>
                    {statusesUnique.map((s) => (
                      <option
                        key={`${s.statusId ?? s.statusName}-${s.statusName}`}
                        value={s.statusId}
                      >
                        {s.statusName}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="row gap">
                    <button className="btn ghost" onClick={() => openEditCar(c)}>
                      <Edit size={16} /> Edit
                    </button>
                    <button className="btn ghost danger" onClick={() => deleteCar(c)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCars.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">No cars match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CarFormModal
        open={carModalOpen}
        car={editingCar}
        onClose={() => setCarModalOpen(false)}
        onSave={saveCar}
        saving={saving}
        brands={brands}
        statuses={statusesUnique}
        onAddBrand={addBrandAndRefresh}
      />
    </>
  );
}

/* ---------- modal: add/edit car ---------- */
function CarFormModal({ open, car, onClose, onSave, saving, brands, statuses, onAddBrand }) {
  const [form, setForm] = useState({
    brandId: "",
    modelName: "",
    year: new Date().getFullYear(),
    dailyRate: "",
    seats: 5,
    transmission: "Automatic",
    fuelType: "Petrol",
    statusId: "",
    imageUrl: "",
    description: "",
  });

  useEffect(() => {
    if (!open) return;

    if (car) {
      setForm({
        brandId: car.brandId || "",
        modelName: car.modelName || "",
        year: car.year || new Date().getFullYear(),
        dailyRate: car.dailyRate || "",
        seats: car.seats || 5,
        transmission: car.transmission || "Automatic",
        fuelType: car.fuelType || "Petrol",
        statusId: car.statusId || "",
        imageUrl: car.imageUrl || "",
        description: car.description || "",
      });
    } else {
      const defaultStatus =
        statuses.find((s) => (s.statusName || "").toLowerCase() === "available")?.statusId ??
        statuses[0]?.statusId ?? "";
      setForm((f) => ({
        ...f,
        brandId: brands[0]?.brandId ?? "",
        modelName: "",
        year: new Date().getFullYear(),
        dailyRate: "",
        seats: 5,
        transmission: "Automatic",
        fuelType: "Petrol",
        statusId: defaultStatus,
        imageUrl: "",
        description: "",
      }));
    }
  }, [open, car, statuses, brands]);

  if (!open) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      brandId: Number(form.brandId),
      modelName: form.modelName.trim(),
      year: Number(form.year),
      fuelType: form.fuelType || null,
      transmission: form.transmission || null,
      seats: form.seats ? Number(form.seats) : 5,
      dailyRate: Number(form.dailyRate),
      statusId: Number(form.statusId),
      imageUrl: form.imageUrl?.trim() || null,
      description: form.description?.trim() || null,
    };
    onSave(payload);
  };

  const ready =
    form.brandId && form.modelName.trim() && form.year && form.dailyRate && form.statusId;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{car ? "Edit Vehicle" : "Add New Vehicle"}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="sheet-form" onSubmit={submit}>
          <div className="grid two">
            <label className="field">
              <span>Vehicle Name (brand + model) *</span>
              <input
                name="modelName"
                value={form.modelName}
                onChange={change}
                placeholder="Corolla, Civic, Model 3…"
                required
              />
            </label>

            <label className="field">
              <span>Model (e.g., SUV)</span>
              <input
                name="description"
                value={form.description}
                onChange={change}
                placeholder="Optional short blurb"
              />
            </label>

            <label className="field">
              <span>Year *</span>
              <input type="number" name="year" value={form.year} min="1990" max="2099" onChange={change} required />
            </label>

            <label className="field">
              <span>Price Per Day (USD) *</span>
              <input type="number" name="dailyRate" value={form.dailyRate} min="1" onChange={change} required />
            </label>

            <label className="field">
              <span>Select Brand *</span>
              <select name="brandId" value={form.brandId} onChange={change} required>
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.brandId ?? b.brandName} value={b.brandId ?? ""}>
                    {b.brandName ?? "Brand"}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Status *</span>
              <select name="statusId" value={form.statusId} onChange={change} required>
                <option value="">Select status</option>
                {statuses.map((s) => (
                  <option key={`${s.statusId}-${s.statusName}`} value={s.statusId}>
                    {s.statusName}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Seats</span>
              <input type="number" name="seats" value={form.seats} min="2" max="9" onChange={change} />
            </label>

            <label className="field">
              <span>Transmission</span>
              <select name="transmission" value={form.transmission} onChange={change}>
                <option>Automatic</option>
                <option>Manual</option>
              </select>
            </label>

            <label className="field">
              <span>Fuel</span>
              <select name="fuelType" value={form.fuelType} onChange={change}>
                <option>Petrol</option>
                <option>Diesel</option>
                <option>Hybrid</option>
                <option>Electric</option>
              </select>
            </label>

            <label className="field">
              <span>Image URL</span>
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={change}
                placeholder="https://cdn.example.com/car.jpg"
              />
            </label>
          </div>
                 
  <img
  className="preview"
  src={form.imageUrl?.trim() || PLACEHOLDER_IMG}
  alt="Preview"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = PLACEHOLDER_IMG;
  }}
/>


          <div className="sheet-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={saving || !ready}>
              {saving ? "Saving…" : car ? "Save Changes" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

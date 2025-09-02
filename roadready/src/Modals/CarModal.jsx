// src/Components/Modals/CarModal.jsx
import { useEffect, useMemo, useState } from "react";
import { listBrands, listStatuses, createCar, updateCar } from "../../services/admin.service";

const asInt = (v) => (v === "" || v == null ? undefined : Number(v));

export default function CarModal({ open, onClose, onSaved, car }) {
  const isEdit = !!car?.carId;
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [form, setForm] = useState({
    brandId: "",
    modelName: "",
    year: "",
    seats: "",
    transmission: "Automatic",
    fuelType: "Petrol",
    dailyRate: "",
    statusId: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const [b, s] = await Promise.all([listBrands(), listStatuses()]);
        setBrands(b.data || []);
        setStatuses(s.data || []);
      } catch {
        setBrands([]);
        setStatuses([]);
      }
    };
    load();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        brandId: car.brandId ?? "",
        modelName: car.modelName ?? car.model ?? "",
        year: car.year ?? "",
        seats: car.seats ?? "",
        transmission: car.transmission ?? "Automatic",
        fuelType: car.fuelType ?? "Petrol",
        dailyRate: car.dailyRate ?? 0,
        statusId: car.statusId ?? "",
        imageUrl: car.imageUrl ?? "",
      });
    } else {
      setForm((f) => ({ ...f, modelName: "", year: "", seats: "", dailyRate: "", imageUrl: "" }));
    }
  }, [open, isEdit, car]);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const previewUrl = useMemo(() => (form.imageUrl || "").trim(), [form.imageUrl]);

  const submit = async () => {
    if (!form.brandId || !form.modelName || !form.year || !form.dailyRate || !form.statusId) {
      alert("Please fill brand, model, year, daily rate and status.");
      return;
    }
    const dto = {
      brandId: asInt(form.brandId),
      modelName: form.modelName.trim(),
      year: asInt(form.year),
      seats: asInt(form.seats) ?? 4,
      transmission: form.transmission,
      fuelType: form.fuelType,
      dailyRate: Number(form.dailyRate),
      statusId: asInt(form.statusId),
      imageUrl: (form.imageUrl || "").trim() || null,
    };
    try {
      setLoading(true);
      if (isEdit) {
        await updateCar(car.carId, dto);
      } else {
        await createCar(dto);
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="cd-modal-backdrop" onClick={onClose}>
      <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cd-modal-head">
          <div className="cd-modal-title">{isEdit ? "Edit Car" : "Add New Car"}</div>
          <button className="cd-icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cd-grid">
          <div className="cd-field">
            <label className="cd-label">Brand</label>
            <select className="cd-input" name="brandId" value={form.brandId} onChange={change}>
              <option value="">Select brand</option>
              {brands.map(b => <option key={b.brandId} value={b.brandId}>{b.brandName}</option>)}
            </select>
          </div>
          <div className="cd-field">
            <label className="cd-label">Model</label>
            <input className="cd-input" name="modelName" value={form.modelName} onChange={change} />
          </div>
        </div>

        <div className="cd-grid">
          <div className="cd-field">
            <label className="cd-label">Year</label>
            <input className="cd-input" name="year" type="number" min="1990" max="2099" value={form.year} onChange={change}/>
          </div>
          <div className="cd-field">
            <label className="cd-label">Seats</label>
            <input className="cd-input" name="seats" type="number" min="2" max="9" value={form.seats} onChange={change}/>
          </div>
          <div className="cd-field">
            <label className="cd-label">Daily rate (USD)</label>
            <input className="cd-input" name="dailyRate" type="number" min="1" step="1" value={form.dailyRate} onChange={change}/>
          </div>
        </div>

        <div className="cd-grid">
          <div className="cd-field">
            <label className="cd-label">Transmission</label>
            <select className="cd-input" name="transmission" value={form.transmission} onChange={change}>
              <option>Automatic</option>
              <option>Manual</option>
            </select>
          </div>
          <div className="cd-field">
            <label className="cd-label">Fuel</label>
            <select className="cd-input" name="fuelType" value={form.fuelType} onChange={change}>
              <option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option>
            </select>
          </div>
          <div className="cd-field">
            <label className="cd-label">Status</label>
            <select className="cd-input" name="statusId" value={form.statusId} onChange={change}>
              <option value="">Select status</option>
              {statuses.map(s => <option key={s.statusId} value={s.statusId}>{s.statusName}</option>)}
            </select>
          </div>
        </div>

        <div className="cd-field">
          <label className="cd-label">Image URL</label>
          <input className="cd-input" name="imageUrl" placeholder="https://…" value={form.imageUrl} onChange={change}/>
          {previewUrl && (
            <div className="cd-image-preview">
              <img src={previewUrl} alt="preview" onError={(e)=>{e.currentTarget.style.display="none";}} />
            </div>
          )}
        </div>

        <button className="cd-btn-primary w-100" disabled={loading} onClick={submit}>
          {loading ? "Saving…" : (isEdit ? "Save changes" : "Create car")}
        </button>
      </div>
    </div>
  );
}

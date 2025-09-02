// src/services/admin.service.js
import api from "../Interceptors/AuthInterceptor";

/* ------- Cars (matches your CarsController) ------- */
export const getCars = () => api.get("Cars");                             // GET /api/Cars
export const getCar = (id) => api.get(`Cars/${id}`);                      // GET /api/Cars/{id}
export const createCar = (dto) => api.post("Cars", dto);                  // POST /api/Cars
export const updateCar = (id, dto) => api.put(`Cars/${id}`, dto);         // PUT /api/Cars/{id}
export const deleteCar = (id) => api.delete(`Cars/${id}`);                // DELETE /api/Cars/{id}
export const setCarStatus = (id, statusId) =>                             // PATCH /api/Cars/{id}/status
  api.patch(`Cars/${id}/status`, { statusId });

/* ------- Helper lookups (adjust if your endpoints differ) ------- */
// If your API exposes CarBrands & CarStatuses, these will populate dropdowns
export const getBrands = () => api.get("CarBrands");          // GET /api/CarBrands
export const getCarStatuses = () => api.get("CarStatuses");   // GET /api/CarStatuses

/* ------- DTO shapers (align with your CarCreateDto / CarUpdateDto) ------- */
export const toCarCreateDto = (f) => ({
  brandId: Number(f.brandId),
  modelName: f.modelName?.trim(),
  year: Number(f.year),
  dailyRate: Number(f.dailyRate),
  seats: Number(f.seats),
  transmission: f.transmission?.trim(),
  fuelType: f.fuelType?.trim(),
  statusId: Number(f.statusId),
  imageUrl: f.imageUrl?.trim() || null, // optional
});

export const toCarUpdateDto = (f) => ({
  brandId: Number(f.brandId),
  modelName: f.modelName?.trim(),
  year: Number(f.year),
  dailyRate: Number(f.dailyRate),
  seats: Number(f.seats),
  transmission: f.transmission?.trim(),
  fuelType: f.fuelType?.trim(),
  statusId: Number(f.statusId),
  imageUrl: f.imageUrl?.trim() || null,
});

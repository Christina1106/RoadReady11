// src/services/customer.service.js
import api from "../Interceptors/AuthInterceptor";

/* ---------------- Cars / Brands ---------------- */

// Try CarBrands first; fall back to Brands if that route doesn't exist.
export const getBrands = async () => {
  try {
    return await api.get("CarBrands");
  } catch {
    return api.get("Brands");
  }
};

export const getCars = () => api.get("Cars");

// Some backends use Cars/search-availability; keep /search as primary.
export const searchCars = async (body) => {
  try {
    return await api.post("Cars/search", body);
  } catch {
    return api.post("Cars/search-availability", body);
  }
};

// Optional: pickup/drop-off locations (handy if you add filters later)
export const getLocations = () => api.get("Locations");

/* ---------------- Bookings ---------------- */

// "mine" first; some APIs expose "my" instead.
export const getMyBookings = async () => {
  try {
    return await api.get("Bookings/mine");
  } catch {
    return api.get("Bookings/my");
  }
};

// Cancel booking with robust fallbacks.
export const cancelBooking = async (bookingId) => {
  try {
    // Preferred: status patch
    return await api.patch(`Bookings/${bookingId}/status`, {
      status: "Cancelled",
    });
  } catch (e1) {
    try {
      // Some APIs expose an action endpoint
      return await api.patch(`Bookings/${bookingId}/cancel`);
    } catch (e2) {
      try {
        // Or POST /cancel
        return await api.post(`Bookings/${bookingId}/cancel`);
      } catch (e3) {
        const status =
          e3?.response?.status ??
          e2?.response?.status ??
          e1?.response?.status ??
          e3?.status ??
          e2?.status ??
          e1?.status;
        const err = new Error("Cancel failed");
        err.status = status;
        throw err;
      }
    }
  }
};

export const getQuote = (carId, fromUtc, toUtc) =>
  api.post("Bookings/quote", { carId, fromUtc, toUtc });

export const createBooking = (payload) => api.post("Bookings", payload);

/* ---------------- Booking Issues ---------------- */

export const getMyIssues = async () => {
  try {
    return await api.get("BookingIssues/mine");
  } catch {
    return api.get("BookingIssues/my");
  }
};

export const getAllIssues = () => api.get("BookingIssues");

export const createIssue = (payload) => api.post("BookingIssues", payload);

export const getBookingIssues = (bookingId) =>
  api.get(`BookingIssues/booking/${bookingId}`);

export const updateIssueStatus = (issueId, status) =>
  api.patch(`BookingIssues/${issueId}/status`, { status });

/* ---------------- Reviews (ratings) ---------------- */

export const createReview = (payload) => api.post("Reviews", payload);

// (Optional for future car detail page)
export const getCarReviews = (carId) => api.get(`Reviews/car/${carId}`);
export const getCarRating = (carId) => api.get(`Reviews/car/${carId}/avg`);

/* ---------------- Maintenance (used elsewhere) ---------------- */

export const createMaintenanceRequest = ({ carId, issueDescription }) =>
  api.post("MaintenanceRequests", { carId, issueDescription });

export const getOpenMaintenance = () => api.get("MaintenanceRequests/open");
export const getMaintenanceForCar = (carId) =>
  api.get(`MaintenanceRequests/car/${carId}`);
export const getMyMaintenance = () => api.get("MaintenanceRequests/mine");
export const resolveMaintenance = (requestId) =>
  api.patch(`MaintenanceRequests/${requestId}/resolve`);

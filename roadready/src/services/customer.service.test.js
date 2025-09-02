/**
 * @file src/services/customer.service.test.js
 *
 * We mock the shared Axios instance to keep these tests fast and isolated.
 * IMPORTANT: keep this file in the *same folder* as customer.service.js so
 * the mock path "../Interceptors/AuthInterceptor" resolves correctly.
 */

jest.mock("../Interceptors/AuthInterceptor", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import api from "../Interceptors/AuthInterceptor";
import {
  // Cars / Brands
  getBrands,
  getCars,
  searchCars,
  getLocations,
  // Bookings
  getMyBookings,
  cancelBooking,
  getQuote,
  createBooking,
  // Issues
  getMyIssues,
  getAllIssues,
  createIssue,
  getBookingIssues,
  updateIssueStatus,
  // Reviews
  createReview,
  // Maintenance
  createMaintenanceRequest,
  getOpenMaintenance,
  getMaintenanceForCar,
  getMyMaintenance,
  resolveMaintenance,
} from "./customer.service";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("customer.service", () => {
  /* ---------------- Cars / Brands ---------------- */

  test("getBrands uses CarBrands then falls back to Brands", async () => {
    // success on CarBrands
    api.get.mockResolvedValueOnce({ data: [{ brandId: 1, brandName: "Ford" }] });
    const r1 = await getBrands();
    expect(api.get).toHaveBeenCalledWith("CarBrands");
    expect(r1.data[0].brandName).toBe("Ford");

    jest.clearAllMocks();

    // fail CarBrands -> succeed Brands
    api.get
      .mockRejectedValueOnce(new Error("404"))
      .mockResolvedValueOnce({ data: [{ brandId: 2, brandName: "Toyota" }] });

    const r2 = await getBrands();
    expect(api.get).toHaveBeenNthCalledWith(1, "CarBrands");
    expect(api.get).toHaveBeenNthCalledWith(2, "Brands");
    expect(r2.data[0].brandName).toBe("Toyota");
  });

  test("getCars calls Cars", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await getCars();
    expect(api.get).toHaveBeenCalledWith("Cars");
  });

  test("searchCars tries /search then falls back to /search-availability", async () => {
    const body = { brandId: 1, minSeats: 4 };

    // Primary fails → fallback succeeds
    api.post
      .mockRejectedValueOnce(new Error("not supported"))
      .mockResolvedValueOnce({ data: [{ carId: 7 }] });

    const r = await searchCars(body);
    expect(api.post).toHaveBeenNthCalledWith(1, "Cars/search", body);
    expect(api.post).toHaveBeenNthCalledWith(2, "Cars/search-availability", body);
    expect(r.data[0].carId).toBe(7);
  });

  test("getLocations calls Locations", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await getLocations();
    expect(api.get).toHaveBeenCalledWith("Locations");
  });

  /* ---------------- Bookings ---------------- */

  test("getMyBookings uses /mine then /my", async () => {
    api.get
      .mockRejectedValueOnce(new Error("404"))
      .mockResolvedValueOnce({ data: [{ bookingId: 10 }] });

    const r = await getMyBookings();
    expect(api.get).toHaveBeenNthCalledWith(1, "Bookings/mine");
    expect(api.get).toHaveBeenNthCalledWith(2, "Bookings/my");
    expect(r.data[0].bookingId).toBe(10);
  });

  test("cancelBooking succeeds via status patch", async () => {
    api.patch.mockResolvedValueOnce({ data: { ok: true } });
    const r = await cancelBooking(123);
    expect(api.patch).toHaveBeenCalledWith("Bookings/123/status", { status: "Cancelled" });
    expect(r.data.ok).toBe(true);
  });

  test("cancelBooking falls back: PATCH /cancel then POST /cancel", async () => {
    // 1) fail status patch
    const err1 = new Error("method not allowed");
    err1.response = { status: 405 };
    api.patch.mockRejectedValueOnce(err1);

    // 2) fail PATCH cancel
    const err2 = new Error("not implemented");
    err2.response = { status: 404 };
    api.patch.mockRejectedValueOnce(err2);

    // 3) succeed POST cancel
    api.post.mockResolvedValueOnce({ data: { cancelled: true } });

    const r = await cancelBooking(55);

    expect(api.patch).toHaveBeenNthCalledWith(1, "Bookings/55/status", { status: "Cancelled" });
    expect(api.patch).toHaveBeenNthCalledWith(2, "Bookings/55/cancel");
    expect(api.post).toHaveBeenCalledWith("Bookings/55/cancel");
    expect(r.data.cancelled).toBe(true);
  });

  test("cancelBooking throws aggregated status when all attempts fail", async () => {
    const e1 = new Error("fail1"); e1.response = { status: 500 };
    const e2 = new Error("fail2"); e2.response = { status: 404 };
    const e3 = new Error("fail3"); e3.response = { status: 400 };

    api.patch.mockRejectedValueOnce(e1); // status patch
    api.patch.mockRejectedValueOnce(e2); // PATCH /cancel
    api.post.mockRejectedValueOnce(e3);  // POST /cancel

    await expect(cancelBooking(9)).rejects.toMatchObject({
      message: "Cancel failed",
      status: 400, // last error status wins per implementation
    });

    expect(api.patch).toHaveBeenNthCalledWith(1, "Bookings/9/status", { status: "Cancelled" });
    expect(api.patch).toHaveBeenNthCalledWith(2, "Bookings/9/cancel");
    expect(api.post).toHaveBeenCalledWith("Bookings/9/cancel");
  });

  test("getQuote posts to Bookings/quote", async () => {
    api.post.mockResolvedValueOnce({ data: { total: 123 } });
    const r = await getQuote(1, "2025-01-01T10:00:00Z", "2025-01-03T10:00:00Z");
    expect(api.post).toHaveBeenCalledWith("Bookings/quote", {
      carId: 1,
      fromUtc: "2025-01-01T10:00:00Z",
      toUtc: "2025-01-03T10:00:00Z",
    });
    expect(r.data.total).toBe(123);
  });

  test("createBooking posts to Bookings", async () => {
    const payload = { carId: 1, fromUtc: "a", toUtc: "b" };
    api.post.mockResolvedValueOnce({ data: { bookingId: 99 } });
    const r = await createBooking(payload);
    expect(api.post).toHaveBeenCalledWith("Bookings", payload);
    expect(r.data.bookingId).toBe(99);
  });

  /* ---------------- Booking Issues ---------------- */

  test("getMyIssues uses /mine then /my", async () => {
    api.get
      .mockRejectedValueOnce(new Error("404"))
      .mockResolvedValueOnce({ data: [{ id: 1 }] });

    const r = await getMyIssues();
    expect(api.get).toHaveBeenNthCalledWith(1, "BookingIssues/mine");
    expect(api.get).toHaveBeenNthCalledWith(2, "BookingIssues/my");
    expect(r.data[0].id).toBe(1);
  });

  test("getAllIssues calls BookingIssues", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await getAllIssues();
    expect(api.get).toHaveBeenCalledWith("BookingIssues");
  });

  test("createIssue posts to BookingIssues", async () => {
    const payload = { bookingId: 7, issueType: "Vehicle", description: "Noise" };
    api.post.mockResolvedValueOnce({ data: { id: 22 } });
    const r = await createIssue(payload);
    expect(api.post).toHaveBeenCalledWith("BookingIssues", payload);
    expect(r.data.id).toBe(22);
  });

  test("getBookingIssues gets BookingIssues/booking/{id}", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await getBookingIssues(3);
    expect(api.get).toHaveBeenCalledWith("BookingIssues/booking/3");
  });

  test("updateIssueStatus patches BookingIssues/{id}/status", async () => {
    api.patch.mockResolvedValueOnce({ data: { ok: true } });
    const r = await updateIssueStatus(5, "Resolved");
    expect(api.patch).toHaveBeenCalledWith("BookingIssues/5/status", { status: "Resolved" });
    expect(r.data.ok).toBe(true);
  });

  /* ---------------- Reviews ---------------- */

  test("createReview posts to Reviews", async () => {
    const payload = { bookingId: 77, rating: 5, comment: "Great!" };
    api.post.mockResolvedValueOnce({ data: { id: 1, ...payload } });

    const r = await createReview(payload);
    expect(api.post).toHaveBeenCalledWith("Reviews", payload);
    expect(r.data.rating).toBe(5);
  });

  /* ---------------- Maintenance ---------------- */

  test("createMaintenanceRequest posts to MaintenanceRequests", async () => {
    const payload = { carId: 2, issueDescription: "Oil leak" };
    api.post.mockResolvedValueOnce({ data: { requestId: 10 } });
    const r = await createMaintenanceRequest(payload);
    expect(api.post).toHaveBeenCalledWith("MaintenanceRequests", payload);
    expect(r.data.requestId).toBe(10);
  });

  test("getOpenMaintenance gets MaintenanceRequests/open", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await getOpenMaintenance();
    expect(api.get).toHaveBeenCalledWith("MaintenanceRequests/open");
  });

  test("getMaintenanceForCar gets MaintenanceRequests/car/{id}", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await getMaintenanceForCar(9);
    expect(api.get).toHaveBeenCalledWith("MaintenanceRequests/car/9");
  });

  test("getMyMaintenance gets MaintenanceRequests/mine", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await getMyMaintenance();
    expect(api.get).toHaveBeenCalledWith("MaintenanceRequests/mine");
  });

  test("resolveMaintenance patches MaintenanceRequests/{id}/resolve", async () => {
    api.patch.mockResolvedValueOnce({ data: {} });
    await resolveMaintenance(33);
    expect(api.patch).toHaveBeenCalledWith("MaintenanceRequests/33/resolve");
  });
});

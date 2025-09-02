// Car from API -> UI-ready
export const normalizeCar = (raw) => ({
  carId: raw.carId,
  brandId: raw.brandId ?? raw.brand?.brandId,
  brandName: raw.brandName ?? raw.brand?.brandName ?? raw.brand ?? "",
  model: raw.model ?? raw.modelName ?? "",
  dailyRate: raw.dailyRate ?? raw.DailyRate ?? raw.pricePerDay ?? 0,
  seats: raw.seats ?? raw.Seats ?? "—",
  fuelType: raw.fuelType ?? raw.FuelType ?? "—",
  transmission: raw.transmission ?? raw.Transmission ?? "—",
  year: raw.year ?? raw.Year ?? "—",
  locationName: raw.locationName ?? raw.location ?? "Branch",
  imageUrl: raw.imageUrl || raw.imageURL || raw.image || "", // raw URL if present
});

// Location
export const normalizeLocation = (raw) => ({
  locationId: raw.locationId ?? raw.id,
  locationName: raw.locationName ?? raw.name ?? "Location",
});

// Booking
export const normalizeBooking = (raw) => ({
  bookingId: raw.bookingId ?? raw.id,
  pickupDateTimeUtc: raw.pickupDateTimeUtc ?? raw.startDate ?? raw.fromUtc,
  dropoffDateTimeUtc: raw.dropoffDateTimeUtc ?? raw.endDate ?? raw.toUtc,
  totalAmount: raw.totalAmount ?? raw.amount ?? 0,
  pickupLocationName: raw.pickupLocationName ?? raw.pickupLocation ?? "—",
  dropoffLocationName: raw.dropoffLocationName ?? raw.dropoffLocation ?? "—",
  statusName: raw.statusName ?? raw.status ?? "Pending",
  carName: raw.carName ?? raw.car?.model ?? "Car",
});

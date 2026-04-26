export interface SavedTrip {
  id: string;
  confirmedAt: string;
  flightOrigin: string;
  flightDestination: string;
  flightDeparture: string;
  flightArrival: string;
  flightAirline: string;
  flightNumber: string;
  flightLogoUrl: string;
  flightPrice: number;
  flightCurrency: string;
  flightDuration: number;
  flightStops: number;
  cabinClass: string;
  hotelName: string;
  hotelAddress: string;
  hotelCheckIn: string;
  hotelCheckOut: string;
  hotelRating: number;
  hotelTotalPrice: number;
  hotelCurrency: string;
  carProvider: string;
  carCategory: string;
  carExample: string;
  pickupLocation: string;
  pickupAt: string;
  dropoffAt: string;
  carTotalPrice: number;
  carDailyRate: number;
  carTotalDays: number;
  totalPrice: number;
  currency: string;
}

const KEY = "wanderly_trips";

export function getTrips(): SavedTrip[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveTrip(trip: Omit<SavedTrip, "id" | "confirmedAt">): SavedTrip {
  const saved: SavedTrip = {
    ...trip,
    id: crypto.randomUUID(),
    confirmedAt: new Date().toISOString(),
  };
  const all = getTrips();
  all.unshift(saved);
  localStorage.setItem(KEY, JSON.stringify(all));
  return saved;
}

export function deleteTrip(id: string): void {
  const all = getTrips().filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

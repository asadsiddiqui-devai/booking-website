export interface Trip {
  id: string;
  user_id: string;
  name: string | null;
  origin_city: string | null;
  origin_iata: string | null;
  destination_city: string | null;
  destination_iata: string | null;
  start_date: string | null;
  end_date: string | null;
  passenger_count: number;
  status: "draft" | "booked" | "cancelled";
  total_price: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface FlightBooking {
  id: string;
  trip_id: string;
  user_id: string;
  duffel_offer_id: string;
  origin_iata: string;
  destination_iata: string;
  departure_at: string;
  arrival_at: string;
  airline_iata: string | null;
  airline_name: string | null;
  flight_number: string | null;
  cabin_class: "economy" | "premium_economy" | "business" | "first";
  fare_basis: string | null;
  stops: number;
  duration_minutes: number | null;
  seat_selection: unknown;
  passengers: unknown;
  price: number;
  currency: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

export interface HotelBooking {
  id: string;
  trip_id: string;
  user_id: string;
  duffel_stay_id: string;
  duffel_quote_id: string | null;
  hotel_name: string;
  hotel_rating: number | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  distance_to_center_km: number | null;
  check_in: string;
  check_out: string;
  nights: number;
  room_type: string | null;
  board_type: string | null;
  amenities: string[] | null;
  guest_info: unknown;
  price_per_night: number | null;
  total_price: number;
  currency: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

export interface CarBooking {
  id: string;
  trip_id: string;
  user_id: string;
  catalog_vehicle_id: string;
  provider_name: string;
  provider_logo_url: string | null;
  vehicle_category:
    | "economy" | "compact" | "midsize" | "fullsize"
    | "suv" | "luxury" | "van" | "convertible";
  vehicle_example: string | null;
  transmission: string | null;
  air_conditioning: boolean;
  seats: number | null;
  doors: number | null;
  pickup_location: string;
  pickup_at: string;
  dropoff_location: string;
  dropoff_at: string;
  daily_rate: number;
  total_days: number;
  total_price: number;
  currency: string;
  driver_info: unknown;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

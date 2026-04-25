export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
}

export interface FlightSegmentDTO {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  airlineIata: string;
  airlineName: string;
  airlineLogoUrl?: string;
  flightNumber: string;
  aircraft?: string;
  durationMinutes: number;
}

export interface FlightOfferDTO {
  id: string;
  totalAmount: number;
  currency: string;
  slices: {
    origin: string;
    originCity?: string;
    destination: string;
    destinationCity?: string;
    durationMinutes: number;
    stops: number;
    segments: FlightSegmentDTO[];
  }[];
  cabinClass: CabinClass;
  airlineIata: string;
  airlineName: string;
  airlineLogoUrl?: string;
  passengerCount: number;
  expiresAt?: string;
}

export interface HotelSearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export interface HotelOfferDTO {
  id: string;
  rateId?: string;
  name: string;
  rating?: number;
  reviewScore?: number;
  address: string;
  lat?: number;
  lng?: number;
  distanceToCenterKm?: number;
  photos: string[];
  amenities: string[];
  roomType?: string;
  boardType?: string;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  nights: number;
}

export interface PlaceSuggestionDTO {
  iataCode: string;
  name: string;
  cityName?: string;
  countryName?: string;
  type: "airport" | "city";
}

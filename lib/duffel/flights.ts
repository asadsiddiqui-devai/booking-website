import { duffelPost, duffelGet } from "./client";
import type {
  FlightOfferDTO,
  FlightSearchParams,
  FlightSegmentDTO,
  CabinClass,
  PlaceSuggestionDTO,
} from "./types";

interface DuffelSegment {
  origin: { iata_code: string };
  destination: { iata_code: string };
  departing_at: string;
  arriving_at: string;
  marketing_carrier: { iata_code: string; name: string; logo_symbol_url?: string };
  marketing_carrier_flight_number: string;
  aircraft?: { name?: string };
  duration: string;
}

interface DuffelSlice {
  origin: { iata_code: string; city_name?: string; name?: string };
  destination: { iata_code: string; city_name?: string; name?: string };
  duration: string;
  segments: DuffelSegment[];
}

interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  owner: { iata_code: string; name: string; logo_symbol_url?: string };
  passengers: { id: string }[];
  slices: DuffelSlice[];
  expires_at?: string;
}

// Duffel's test API returns a fictional "Duffel Airways" carrier under
// IATA code ZZ. Exclude it so users only see real airline inventory.
const DUFFEL_TEST_CARRIER_IATA = "ZZ";

function isRealAirlineOffer(o: DuffelOffer): boolean {
  if (o.owner.iata_code === DUFFEL_TEST_CARRIER_IATA) return false;
  return o.slices.every((slice) =>
    slice.segments.every(
      (s) => s.marketing_carrier.iata_code !== DUFFEL_TEST_CARRIER_IATA,
    ),
  );
}

function parseIsoDuration(iso: string): number {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
  if (!match) return 0;
  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  return h * 60 + m;
}

function mapSegment(s: DuffelSegment): FlightSegmentDTO {
  return {
    origin: s.origin.iata_code,
    destination: s.destination.iata_code,
    departureAt: s.departing_at,
    arrivalAt: s.arriving_at,
    airlineIata: s.marketing_carrier.iata_code,
    airlineName: s.marketing_carrier.name,
    airlineLogoUrl: s.marketing_carrier.logo_symbol_url,
    flightNumber: `${s.marketing_carrier.iata_code}${s.marketing_carrier_flight_number}`,
    aircraft: s.aircraft?.name,
    durationMinutes: parseIsoDuration(s.duration),
  };
}

function mapOffer(o: DuffelOffer, cabinClass: CabinClass): FlightOfferDTO {
  return {
    id: o.id,
    totalAmount: Number(o.total_amount),
    currency: o.total_currency,
    airlineIata: o.owner.iata_code,
    airlineName: o.owner.name,
    airlineLogoUrl: o.owner.logo_symbol_url,
    cabinClass,
    passengerCount: o.passengers.length,
    expiresAt: o.expires_at,
    slices: o.slices.map((slice) => ({
      origin: slice.origin.iata_code,
      originCity: slice.origin.city_name ?? slice.origin.name,
      destination: slice.destination.iata_code,
      destinationCity: slice.destination.city_name ?? slice.destination.name,
      durationMinutes: parseIsoDuration(slice.duration),
      stops: Math.max(0, slice.segments.length - 1),
      segments: slice.segments.map(mapSegment),
    })),
  };
}

export async function searchFlights(
  params: FlightSearchParams,
): Promise<FlightOfferDTO[]> {
  const slices: { origin: string; destination: string; departure_date: string }[] =
    [
      {
        origin: params.origin,
        destination: params.destination,
        departure_date: params.departureDate,
      },
    ];
  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
    });
  }

  const passengers = Array.from({ length: params.passengers }, () => ({
    type: "adult",
  }));

  const res = await duffelPost<{ data: { offers: DuffelOffer[] } }>(
    "/air/offer_requests?return_offers=true",
    {
      slices,
      passengers,
      cabin_class: params.cabinClass,
    },
  );

  return (res.data.offers ?? [])
    .filter(isRealAirlineOffer)
    .map((o) => mapOffer(o, params.cabinClass));
}

export async function getFlightOffer(
  offerId: string,
  cabinClass: CabinClass = "economy",
): Promise<FlightOfferDTO> {
  const res = await duffelGet<{ data: DuffelOffer }>(`/air/offers/${offerId}`);
  return mapOffer(res.data, cabinClass);
}

export async function suggestPlaces(
  query: string,
): Promise<PlaceSuggestionDTO[]> {
  if (!query.trim()) return [];
  const res = await duffelGet<{
    data: {
      iata_code: string;
      name: string;
      city_name?: string;
      iata_country_code?: string;
      type: string;
    }[];
  }>(`/places/suggestions?query=${encodeURIComponent(query)}`);

  return (res.data ?? [])
    .filter((p) => p.iata_code)
    .map((p) => ({
      iataCode: p.iata_code,
      name: p.name,
      cityName: p.city_name,
      countryName: p.iata_country_code,
      type: (p.type === "city" ? "city" : "airport") as "city" | "airport",
    }));
}

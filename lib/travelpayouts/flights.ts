import { tpGet } from "./client";
import type {
  FlightOfferDTO,
  FlightSearchParams,
  FlightSegmentDTO,
  CabinClass,
  PlaceSuggestionDTO,
} from "../duffel/types";

const AIRLINE_NAMES: Record<string, string> = {
  AA: "American Airlines",
  UA: "United Airlines",
  DL: "Delta Air Lines",
  BA: "British Airways",
  LH: "Lufthansa",
  AF: "Air France",
  EK: "Emirates",
  QR: "Qatar Airways",
  SQ: "Singapore Airlines",
  CX: "Cathay Pacific",
  TK: "Turkish Airlines",
  FR: "Ryanair",
  U2: "easyJet",
  WN: "Southwest Airlines",
  AC: "Air Canada",
  QF: "Qantas",
  EY: "Etihad Airways",
  NH: "ANA",
  JL: "Japan Airlines",
  KL: "KLM",
  IB: "Iberia",
  AZ: "ITA Airways",
  SU: "Aeroflot",
  B6: "JetBlue",
  AS: "Alaska Airlines",
  F9: "Frontier Airlines",
  NK: "Spirit Airlines",
  WS: "WestJet",
  AI: "Air India",
  MH: "Malaysia Airlines",
  TG: "Thai Airways",
  GA: "Garuda Indonesia",
  VN: "Vietnam Airlines",
  OZ: "Asiana Airlines",
  KE: "Korean Air",
  CI: "China Airlines",
  BR: "EVA Air",
  CA: "Air China",
  CZ: "China Southern",
  MU: "China Eastern",
  ET: "Ethiopian Airlines",
  LO: "LOT Polish Airlines",
  OS: "Austrian Airlines",
  LX: "SWISS",
  SK: "Scandinavian Airlines",
  AY: "Finnair",
  VY: "Vueling",
  TP: "TAP Air Portugal",
  LA: "LATAM Airlines",
  AM: "Aeromexico",
  CM: "Copa Airlines",
  AV: "Avianca",
};

function airlineName(iata: string): string {
  return AIRLINE_NAMES[iata] ?? iata;
}

function airlineLogoUrl(iata: string): string {
  return `https://pics.avs.io/64/64/${iata}.png`;
}

function addMinutes(isoDate: string, minutes: number): string {
  return new Date(new Date(isoDate).getTime() + minutes * 60_000).toISOString();
}

interface TpFlight {
  origin: string;
  destination: string;
  origin_airport: string;
  destination_airport: string;
  price: number;
  airline: string;
  flight_number: number;
  departure_at: string;
  return_at?: string;
  transfers: number;
  return_transfers?: number;
  duration: number;
  duration_to: number;
  duration_back?: number;
  link: string;
  currency: string;
}

interface TpSearchResponse {
  success: boolean;
  data: TpFlight[];
  currency: string;
}

function makeSegment(
  origin: string,
  destination: string,
  departureAt: string,
  durationMinutes: number,
  airline: string,
  flightNumber: number,
): FlightSegmentDTO {
  return {
    origin,
    destination,
    departureAt,
    arrivalAt: addMinutes(departureAt, durationMinutes),
    airlineIata: airline,
    airlineName: airlineName(airline),
    airlineLogoUrl: airlineLogoUrl(airline),
    flightNumber: `${airline}${flightNumber}`,
    durationMinutes,
  };
}

function encodeOffer(offer: Omit<FlightOfferDTO, "id">): string {
  return "tp_" + Buffer.from(JSON.stringify(offer)).toString("base64url");
}

function decodeOffer(id: string): Omit<FlightOfferDTO, "id"> | null {
  if (!id.startsWith("tp_")) return null;
  try {
    return JSON.parse(Buffer.from(id.slice(3), "base64url").toString());
  } catch {
    return null;
  }
}

function mapToOffer(
  f: TpFlight,
  currency: string,
  params: FlightSearchParams,
): FlightOfferDTO {
  const outbound = makeSegment(
    f.origin_airport,
    f.destination_airport,
    f.departure_at,
    f.duration_to,
    f.airline,
    f.flight_number,
  );

  const slices: FlightOfferDTO["slices"] = [
    {
      origin: f.origin_airport,
      originCity: f.origin,
      destination: f.destination_airport,
      destinationCity: f.destination,
      durationMinutes: f.duration_to,
      stops: f.transfers,
      segments: [outbound],
    },
  ];

  if (params.returnDate && f.return_at && f.duration_back != null) {
    const ret = makeSegment(
      f.destination_airport,
      f.origin_airport,
      f.return_at,
      f.duration_back,
      f.airline,
      f.flight_number + 1,
    );
    slices.push({
      origin: f.destination_airport,
      originCity: f.destination,
      destination: f.origin_airport,
      destinationCity: f.origin,
      durationMinutes: f.duration_back,
      stops: f.return_transfers ?? 0,
      segments: [ret],
    });
  }

  const partial: Omit<FlightOfferDTO, "id"> = {
    totalAmount: f.price,
    currency: currency.toUpperCase(),
    airlineIata: f.airline,
    airlineName: airlineName(f.airline),
    airlineLogoUrl: airlineLogoUrl(f.airline),
    cabinClass: params.cabinClass,
    passengerCount: params.passengers,
    slices,
  };

  return { id: encodeOffer(partial), ...partial };
}

export async function searchFlights(
  params: FlightSearchParams,
): Promise<FlightOfferDTO[]> {
  const query: Record<string, string> = {
    origin: params.origin,
    destination: params.destination,
    departure_at: params.departureDate,
    currency: "usd",
    market: "us",
    locale: "en",
    limit: "50",
    sorting: "price",
  };

  if (params.returnDate) {
    query.return_at = params.returnDate;
  } else {
    query.one_way = "true";
  }

  const res = await tpGet<TpSearchResponse>(
    "https://api.travelpayouts.com/aviasales/v3/prices_for_dates",
    query,
  );

  if (!res.success || !Array.isArray(res.data)) return [];

  const currency = res.currency ?? "usd";
  return res.data.map((f) => mapToOffer(f, currency, params));
}

export async function getFlightOffer(
  offerId: string,
  cabinClass: CabinClass = "economy",
): Promise<FlightOfferDTO> {
  const decoded = decodeOffer(offerId);
  if (decoded) {
    return { id: offerId, ...decoded, cabinClass };
  }
  throw new Error("Invalid or expired flight offer ID");
}

interface TpPlace {
  id: string;
  name: string;
  type: string;
  country_name?: string;
  city?: { name: string; iata: string };
}

export async function suggestPlaces(
  query: string,
): Promise<PlaceSuggestionDTO[]> {
  if (!query.trim()) return [];

  // Travelpayouts autocomplete doesn't require auth; types[] needs manual URL construction
  const url = `https://autocomplete.travelpayouts.com/places2?locale=en&types[]=airport&types[]=city&term=${encodeURIComponent(query)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const results: TpPlace[] = await res.json();
  return (Array.isArray(results) ? results : [])
    .filter((p) => /^[A-Za-z]{3}$/.test(p.id)) // drop numeric / non-IATA entries
    .map((p) => ({
      iataCode: p.id.toUpperCase(),
      name: p.name,
      cityName: p.type === "city" ? p.name : p.city?.name,
      countryName: p.country_name,
      type: (p.type === "city" ? "city" : "airport") as "city" | "airport",
    }));
}

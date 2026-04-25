import fs from "fs";
import path from "path";
import type { HotelOfferDTO } from "@/lib/duffel/types";
import { haversineKm } from "@/lib/geo/haversine";

const API_KEY = process.env.RAPIDAPI_KEY ?? "";
const HOST = "booking-com15.p.rapidapi.com";
const CACHE_DIR = path.join(process.cwd(), "data", "cache", "hotels");

function cacheKey(city: string, checkIn: string, checkOut: string, guests: number, rooms: number) {
  return `${city.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${checkIn}_${checkOut}_g${guests}_r${rooms}.json`;
}

function readCache(key: string): HotelOfferDTO[] | null {
  try {
    const file = path.join(CACHE_DIR, key);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw) as HotelOfferDTO[];
  } catch {
    return null;
  }
}

function writeCache(key: string, data: HotelOfferDTO[]): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CACHE_DIR, key), JSON.stringify(data, null, 2));
  } catch {
    // non-fatal
  }
}

async function searchDestinationId(city: string): Promise<string | null> {
  const url = new URL(`https://${HOST}/api/v1/hotels/searchDestination`);
  url.searchParams.set("query", city);
  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": HOST,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json() as { status: boolean; data: { dest_id: string; dest_type: string; name: string }[] };
  if (!json.status || !json.data?.length) return null;
  // prefer city type
  const city_result = json.data.find((d) => d.dest_type === "city") ?? json.data[0];
  return city_result.dest_id;
}

interface BookingHotel {
  hotel_id: number;
  property: {
    id: number;
    name: string;
    qualityClass: number;
    accuratePropertyClass: number;
    reviewScore?: number;
    reviewScoreWord?: string;
    reviewCount?: number;
    latitude: number;
    longitude: number;
    photoUrls?: string[];
    priceBreakdown?: {
      grossPrice?: { value: number; currency: string };
      excludedPrice?: { value: number; currency: string };
    };
    countryCode?: string;
    checkinDate?: string;
    checkoutDate?: string;
  };
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

function mapHotel(
  h: BookingHotel,
  nights: number,
  centerLat: number,
  centerLng: number,
): HotelOfferDTO {
  const p = h.property;
  const totalPrice = p.priceBreakdown?.grossPrice?.value ?? 0;
  const currency = p.priceBreakdown?.grossPrice?.currency ?? "USD";
  const stars = p.accuratePropertyClass > 0 ? p.accuratePropertyClass : (p.qualityClass > 0 ? p.qualityClass : undefined);

  return {
    id: String(p.id),
    name: p.name,
    rating: stars,
    reviewScore: p.reviewScore,
    address: p.countryCode ?? "",
    lat: p.latitude,
    lng: p.longitude,
    distanceToCenterKm: Number(haversineKm(centerLat, centerLng, p.latitude, p.longitude).toFixed(2)),
    photos: p.photoUrls ?? [],
    amenities: [],
    pricePerNight: nights > 0 ? Number((totalPrice / nights).toFixed(2)) : totalPrice,
    totalPrice: Number(totalPrice.toFixed(2)),
    currency,
    nights,
  };
}

export async function searchHotels(
  city: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  rooms: number,
  centerLat: number,
  centerLng: number,
): Promise<HotelOfferDTO[]> {
  const key = cacheKey(city, checkIn, checkOut, guests, rooms);
  const cached = readCache(key);
  if (cached) {
    console.log(`[hotels] cache hit: ${key}`);
    return cached;
  }

  if (!API_KEY) throw new Error("RAPIDAPI_KEY is missing");

  const destId = await searchDestinationId(city);
  if (!destId) throw new Error(`Could not find destination for "${city}"`);

  const url = new URL(`https://${HOST}/api/v1/hotels/searchHotels`);
  url.searchParams.set("dest_id", destId);
  url.searchParams.set("search_type", "city");
  url.searchParams.set("arrival_date", checkIn);
  url.searchParams.set("departure_date", checkOut);
  url.searchParams.set("adults", String(guests));
  url.searchParams.set("room_qty", String(rooms));
  url.searchParams.set("page_number", "1");
  url.searchParams.set("languagecode", "en-us");
  url.searchParams.set("currency_code", "USD");

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": HOST,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Booking.com API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json() as {
    status: boolean;
    message?: unknown;
    data?: { hotels: BookingHotel[] };
  };

  if (!json.status) {
    throw new Error(`Booking.com: ${JSON.stringify(json.message ?? "Unknown error")}`);
  }

  const nights = nightsBetween(checkIn, checkOut);
  const hotels = (json.data?.hotels ?? []).map((h) => mapHotel(h, nights, centerLat, centerLng));

  writeCache(key, hotels);
  return hotels;
}

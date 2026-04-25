import fs from "fs";
import path from "path";
import type { CarResult } from "@/lib/cars/search";
import { searchCars as catalogSearch } from "@/lib/cars/search";

const API_KEY = process.env.RAPIDAPI_KEY ?? "";
const HOST = "booking-com15.p.rapidapi.com";
const CACHE_DIR = path.join(process.cwd(), "data", "cache", "cars");

function cacheKey(location: string, pickupAt: string, dropoffAt: string) {
  return `${location.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${pickupAt.slice(0, 10)}_${dropoffAt.slice(0, 10)}.json`;
}

function readCache(key: string): CarResult[] | null {
  try {
    const file = path.join(CACHE_DIR, key);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8")) as CarResult[];
  } catch {
    return null;
  }
}

function writeCache(key: string, data: CarResult[]): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CACHE_DIR, key), JSON.stringify(data, null, 2));
  } catch {
    // non-fatal
  }
}

export interface CarSearchParams {
  location: string;
  pickupAt: string;
  dropoffAt: string;
  pickupLat?: number;
  pickupLng?: number;
}

async function searchDestinationId(location: string): Promise<string | null> {
  const url = new URL(`https://${HOST}/api/v1/cars/searchDestination`);
  url.searchParams.set("query", location);
  try {
    const res = await fetch(url.toString(), {
      headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": HOST },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json() as { status: boolean; data: { id?: string; dest_id?: string; name: string }[] };
    if (!json.status || !json.data?.length) return null;
    const first = json.data[0];
    return first.id ?? first.dest_id ?? null;
  } catch {
    return null;
  }
}

function daysBetween(iso1: string, iso2: string): number {
  const ms = new Date(iso2).getTime() - new Date(iso1).getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

function pickupDate(iso: string): string {
  return iso.slice(0, 10);
}

function pickupTime(iso: string): string {
  // "2026-06-01T12:00" → "12:00", default "10:00"
  return iso.length >= 16 ? iso.slice(11, 16) : "10:00";
}

interface BookingCar {
  vehicle?: {
    id?: string;
    name?: string;
    category?: string;
    doors?: number;
    seats?: number;
    transmission?: string;
    airConditioning?: boolean;
    imageUrl?: string;
  };
  supplier?: {
    name?: string;
    logoUrl?: string;
  };
  pricing?: {
    total?: { amount?: number; currency?: string };
    daily?: { amount?: number; currency?: string };
  };
}

function mapBookingCar(car: BookingCar, days: number, location: string, pickupIso: string): CarResult | null {
  const v = car.vehicle;
  const s = car.supplier;
  const pricing = car.pricing;
  if (!v?.name) return null;

  const totalPrice = pricing?.total?.amount ?? 0;
  const currency = (pricing?.total?.currency ?? "USD") as "USD";
  const dailyRate = pricing?.daily?.amount ?? (days > 0 ? totalPrice / days : totalPrice);

  return {
    id: `bk_${v.id ?? v.name}_${location}_${pickupIso}`,
    providerId: s?.name?.toLowerCase().replace(/\s+/g, "_") ?? "unknown",
    providerName: s?.name ?? "Unknown",
    providerLogoUrl: s?.logoUrl ?? "",
    categoryId: "economy",
    categoryLabel: v.category ?? v.name,
    example: v.name,
    seats: v.seats ?? 5,
    doors: v.doors ?? 4,
    transmission: (v.transmission?.toLowerCase().includes("manual") ? "manual" : "automatic") as "automatic" | "manual",
    airConditioning: v.airConditioning ?? true,
    dailyRate: Math.round(dailyRate * 100) / 100,
    totalDays: days,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency,
  };
}

export async function searchCarsLive(params: CarSearchParams): Promise<CarResult[]> {
  const key = cacheKey(params.location, params.pickupAt, params.dropoffAt);
  const cached = readCache(key);
  if (cached) {
    console.log(`[cars] cache hit: ${key}`);
    return cached;
  }

  if (!API_KEY) {
    console.warn("[cars] RAPIDAPI_KEY missing, using catalog fallback");
    return catalogSearch({ location: params.location, pickupAt: params.pickupAt, dropoffAt: params.dropoffAt });
  }

  try {
    // Try to get a location ID for the pick-up location
    const destId = await searchDestinationId(params.location);

    const pickDate = pickupDate(params.pickupAt);
    const dropDate = pickupDate(params.dropoffAt);
    const pickTime = pickupTime(params.pickupAt);
    const dropTime = pickupTime(params.dropoffAt);
    const days = daysBetween(params.pickupAt, params.dropoffAt);

    // Use coords-based endpoint if we have lat/lng, otherwise city-name
    const url = new URL(`https://${HOST}/api/v1/cars/searchCarRentals`);
    if (params.pickupLat != null && params.pickupLng != null) {
      url.searchParams.set("pick_up_latitude", String(params.pickupLat));
      url.searchParams.set("pick_up_longitude", String(params.pickupLng));
      url.searchParams.set("drop_off_latitude", String(params.pickupLat));
      url.searchParams.set("drop_off_longitude", String(params.pickupLng));
    } else if (destId) {
      url.searchParams.set("pick_up_id", destId);
      url.searchParams.set("drop_off_id", destId);
    } else {
      throw new Error("No location ID resolved");
    }
    url.searchParams.set("pick_up_date", pickDate);
    url.searchParams.set("drop_off_date", dropDate);
    url.searchParams.set("pick_up_time", pickTime);
    url.searchParams.set("drop_off_time", dropTime);
    url.searchParams.set("driver_age", "30");
    url.searchParams.set("currency_code", "USD");

    const res = await fetch(url.toString(), {
      headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": HOST },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Booking.com cars API ${res.status}`);

    const json = await res.json() as { status: boolean; data?: { cars?: BookingCar[] } };
    if (!json.status || !json.data?.cars?.length) throw new Error("No cars returned");

    const results = json.data.cars
      .map((c) => mapBookingCar(c, days, params.location, pickDate))
      .filter((c): c is CarResult => c !== null)
      .sort((a, b) => a.totalPrice - b.totalPrice);

    writeCache(key, results);
    return results;
  } catch (err) {
    console.warn("[cars] Booking.com car API failed, using catalog fallback:", (err as Error).message);
    const results = catalogSearch({
      location: params.location,
      pickupAt: params.pickupAt,
      dropoffAt: params.dropoffAt,
    });
    writeCache(key, results);
    return results;
  }
}

import { haversineKm } from "@/lib/geo/haversine";
import type { HotelOfferDTO } from "@/lib/duffel/types";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const XOTELO_BASE = "https://data.xotelo.com/api";
const OVERPASS_TIMEOUT_MS = 8000;

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface XoteloRatesResult {
  error: string | null;
  result: {
    rates: Array<{ code: string; name: string; rate: number }>;
  };
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

function estimatePrice(stars: number | undefined, hotelName: string): number {
  const baseRanges: Record<number, [number, number]> = {
    1: [45, 85],
    2: [70, 120],
    3: [100, 180],
    4: [180, 300],
    5: [280, 500],
  };
  const [min, max] = baseRanges[Math.round(stars ?? 3)] ?? [100, 180];
  let hash = 0;
  for (let i = 0; i < hotelName.length; i++) {
    hash = (hash * 31 + hotelName.charCodeAt(i)) & 0xffffffff;
  }
  const fraction = Math.abs(hash % 1000) / 1000;
  return Math.round(min + fraction * (max - min));
}

function generateFallbackHotels(
  city: string,
  centerLat: number,
  centerLng: number,
  nights: number,
): HotelOfferDTO[] {
  const brands = [
    { name: `Four Seasons ${city}`, stars: 5 },
    { name: `The Ritz-Carlton ${city}`, stars: 5 },
    { name: `St. Regis ${city}`, stars: 5 },
    { name: `Waldorf Astoria ${city}`, stars: 5 },
    { name: `Park Hyatt ${city}`, stars: 5 },
    { name: `Mandarin Oriental ${city}`, stars: 5 },
    { name: `Marriott ${city}`, stars: 4 },
    { name: `Hilton ${city}`, stars: 4 },
    { name: `Sheraton ${city}`, stars: 4 },
    { name: `InterContinental ${city}`, stars: 5 },
    { name: `JW Marriott ${city}`, stars: 5 },
    { name: `W Hotel ${city}`, stars: 4 },
    { name: `Hyatt Regency ${city}`, stars: 4 },
    { name: `Sofitel ${city}`, stars: 4 },
    { name: `Radisson Blu ${city}`, stars: 4 },
    { name: `Westin ${city}`, stars: 4 },
    { name: `Novotel ${city}`, stars: 4 },
    { name: `Pullman ${city}`, stars: 4 },
    { name: `Crowne Plaza ${city}`, stars: 4 },
    { name: `DoubleTree by Hilton ${city}`, stars: 4 },
    { name: `Renaissance ${city} Hotel`, stars: 4 },
    { name: `Grand Hyatt ${city}`, stars: 5 },
    { name: `Le Meridien ${city}`, stars: 4 },
    { name: `Courtyard by Marriott ${city}`, stars: 3 },
    { name: `Hampton Inn ${city}`, stars: 3 },
  ];
  return brands.map((brand, i) => {
    const pricePerNight = estimatePrice(brand.stars, brand.name);
    const totalPrice = Number((pricePerNight * nights).toFixed(2));

    return {
      id: `fallback-${i}`,
      name: brand.name,
      rating: brand.stars,
      reviewScore: undefined,
      address: city,
      // No coordinates — fallback hotels have no real location so they
      // are shown in the list only, never as map pins.
      lat: undefined,
      lng: undefined,
      distanceToCenterKm: undefined,
      photos: [],
      amenities: [],
      pricePerNight: Number(pricePerNight.toFixed(2)),
      totalPrice,
      currency: "USD",
      nights,
    };
  });
}

async function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchXoteloRates(
  hotelKey: string,
  checkIn: string,
  checkOut: string,
  adults: number,
): Promise<number | null> {
  try {
    const url = `${XOTELO_BASE}/rates?hotel_key=${encodeURIComponent(hotelKey)}&chk_in=${checkIn}&chk_out=${checkOut}&adults=${adults}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = (await res.json()) as XoteloRatesResult;
    const rates = data.result?.rates ?? [];
    if (rates.length === 0) return null;
    const cheapest = Math.min(...rates.map((r) => r.rate).filter((r) => r > 0));
    return cheapest === Infinity ? null : cheapest;
  } catch {
    return null;
  }
}

export async function searchHotels(
  city: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  centerLat: number,
  centerLng: number,
): Promise<HotelOfferDTO[]> {
  const nights = nightsBetween(checkIn, checkOut);

  const radius = 10000;
  const query = `[out:json][timeout:8];
(
  node["tourism"="hotel"](around:${radius},${centerLat},${centerLng});
  way["tourism"="hotel"](around:${radius},${centerLat},${centerLng});
  relation["tourism"="hotel"](around:${radius},${centerLat},${centerLng});
);
out center tags;`;

  let overpassRes: Response | null = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
          next: { revalidate: 3600 },
        },
        OVERPASS_TIMEOUT_MS,
      );
      if (res.ok) {
        overpassRes = res;
        break;
      }
      console.warn(`[hotels] Overpass ${endpoint} returned ${res.status}`);
    } catch (err) {
      console.warn(`[hotels] Overpass ${endpoint} failed:`, err);
    }
  }

  // If all Overpass mirrors fail, return synthetic fallback results
  if (!overpassRes) {
    console.warn("[hotels] All Overpass endpoints failed — using fallback hotel generator");
    return generateFallbackHotels(city, centerLat, centerLng, nights);
  }

  const overpassData = (await overpassRes.json()) as OverpassResponse;
  const elements = overpassData.elements ?? [];

  const hotels = elements
    .filter((el) => el.tags?.name && (el.lat ?? el.center?.lat))
    .sort((a, b) => {
      const starsA = a.tags?.stars ? parseFloat(a.tags.stars) : 0;
      const starsB = b.tags?.stars ? parseFloat(b.tags.stars) : 0;
      return starsB - starsA;
    })
    .slice(0, 25);

  // Fall back to generated results if OSM returned nothing for this city
  if (hotels.length === 0) {
    return generateFallbackHotels(city, centerLat, centerLng, nights);
  }

  const ratePromises = hotels.map((el) => {
    const taKey = el.tags?.["tripadvisor"] ?? el.tags?.["ref:tripadvisor"];
    const match = taKey?.match(/d(\d+)/);
    const hotelKey = match ? `d${match[1]}` : null;
    if (hotelKey) {
      return fetchXoteloRates(hotelKey, checkIn, checkOut, adults);
    }
    return Promise.resolve(null);
  });

  const resolvedRates = await Promise.all(ratePromises);

  return hotels.map((el, i) => {
    const tags = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat ?? 0;
    const lng = el.lon ?? el.center?.lon ?? 0;
    const name = tags.name;
    const stars = tags.stars ? parseFloat(tags.stars) : undefined;

    const address = [
      tags["addr:housenumber"] && tags["addr:street"]
        ? `${tags["addr:housenumber"]} ${tags["addr:street"]}`
        : tags["addr:street"],
      tags["addr:city"] ?? city,
    ]
      .filter(Boolean)
      .join(", ");

    const pricePerNight = resolvedRates[i] ?? estimatePrice(stars, name);
    const totalPrice = Number((pricePerNight * nights).toFixed(2));

    return {
      id: String(el.id),
      name,
      rating: stars,
      reviewScore: undefined,
      address: address || city,
      lat,
      lng,
      distanceToCenterKm: Number(
        haversineKm(centerLat, centerLng, lat, lng).toFixed(2),
      ),
      photos: [],
      amenities: [],
      pricePerNight: Number(pricePerNight.toFixed(2)),
      totalPrice,
      currency: "USD",
      nights,
    };
  });
}

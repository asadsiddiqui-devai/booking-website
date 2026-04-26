export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

const memCache = new Map<string, GeocodeResult>();

export async function geocode(query: string): Promise<GeocodeResult | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;

  if (memCache.has(key)) return memCache.get(key)!;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (err) {
    console.error("[geocode] fetch failed:", err);
    return null;
  }
  if (!res.ok) {
    console.error("[geocode] geocoding API returned", res.status, res.statusText);
    return null;
  }
  let json: { results?: { latitude: number; longitude: number; name: string; country?: string }[] };
  try {
    json = await res.json();
  } catch (err) {
    console.error("[geocode] invalid JSON response:", err);
    return null;
  }
  const first = json.results?.[0];
  if (!first) {
    console.error("[geocode] no results for query:", query);
    return null;
  }

  const result: GeocodeResult = {
    lat: first.latitude,
    lng: first.longitude,
    displayName: [first.name, first.country].filter(Boolean).join(", "),
  };

  memCache.set(key, result);
  return result;
}

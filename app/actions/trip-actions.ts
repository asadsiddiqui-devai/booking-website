"use server";

export async function hotelSearchAction(
  city: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  rooms: number,
) {
  const { geocode } = await import("@/lib/geo/nominatim");
  const { searchHotels } = await import("@/lib/booking/hotels");
  const geo = await geocode(city);
  if (!geo)
    return {
      results: [],
      center: null as { lat: number; lng: number; name: string } | null,
      error: "Could not resolve city",
    };
  try {
    const results = await searchHotels(city, checkIn, checkOut, guests, rooms, geo.lat, geo.lng);
    return {
      results,
      center: { lat: geo.lat, lng: geo.lng, name: geo.displayName },
      error: null as string | null,
    };
  } catch (err) {
    return {
      results: [],
      center: { lat: geo.lat, lng: geo.lng, name: geo.displayName },
      error: (err as Error).message,
    };
  }
}

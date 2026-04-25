import { PageTransition } from "@/components/motion/page-transition";
import { getDemoContext } from "@/lib/demo-user";
import { geocode } from "@/lib/geo/nominatim";
import { searchHotels } from "@/lib/booking/hotels";
import { HotelSearchView } from "@/components/search/hotel-search-view";
import type { HotelOfferDTO } from "@/lib/duffel/types";

interface PageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

export default async function HotelSearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tripId = typeof sp.tripId === "string" ? sp.tripId : undefined;

  const { supabase, user } = await getDemoContext();

  let city = typeof sp.city === "string" ? sp.city : "";
  let checkIn = typeof sp.checkIn === "string" ? sp.checkIn : "";
  let checkOut = typeof sp.checkOut === "string" ? sp.checkOut : "";
  const guests = Number(sp.guests ?? 1);
  const rooms = Number(sp.rooms ?? 1);

  // Prefill from trip if navigating from a flight booking
  if (tripId && (!city || !checkIn || !checkOut)) {
    const { data: trip } = await supabase
      .from("trips")
      .select("destination_iata, destination_city, start_date, end_date")
      .eq("id", tripId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (trip) {
      city = city || trip.destination_city || trip.destination_iata || "";
      checkIn = checkIn || trip.start_date || "";
      checkOut = checkOut || trip.end_date || "";
    }
  }

  let results: HotelOfferDTO[] = [];
  let center: { lat: number; lng: number; name: string } | null = null;
  let searchError: string | null = null;
  const hasQuery = !!city && !!checkIn && !!checkOut;

  if (hasQuery) {
    const geo = await geocode(city);
    if (!geo) {
      searchError = `Could not find location "${city}".`;
    } else {
      center = { lat: geo.lat, lng: geo.lng, name: geo.displayName };
      try {
        results = await searchHotels(
          city,
          checkIn,
          checkOut,
          guests,
          rooms,
          geo.lat,
          geo.lng,
        );
      } catch (err) {
        searchError = (err as Error).message;
      }
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Find a hotel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real hotels powered by Booking.com.
        </p>
        <HotelSearchView
          defaults={{ city, checkIn, checkOut, guests, rooms }}
          tripId={tripId}
          results={results}
          center={center}
          error={searchError}
          hasQuery={hasQuery}
        />
      </div>
    </PageTransition>
  );
}

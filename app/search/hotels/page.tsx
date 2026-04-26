import { PageTransition } from "@/components/motion/page-transition";
import { geocode } from "@/lib/geo/nominatim";
import { searchHotels } from "@/lib/booking/hotels";
import { HotelSearchView } from "@/components/search/hotel-search-view";
import type { HotelOfferDTO } from "@/lib/duffel/types";

interface PageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

export default async function HotelSearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const flightOfferId = typeof sp.flightOfferId === "string" ? sp.flightOfferId : undefined;
  const cabinClass = typeof sp.cabinClass === "string" ? sp.cabinClass : undefined;

  const city = typeof sp.city === "string" ? sp.city : "";
  const checkIn = typeof sp.checkIn === "string" ? sp.checkIn : "";
  const checkOut = typeof sp.checkOut === "string" ? sp.checkOut : "";
  const guests = Number(sp.guests ?? 1);
  const rooms = Number(sp.rooms ?? 1);

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
          flightOfferId={flightOfferId}
          cabinClass={cabinClass}
          results={results}
          center={center}
          error={searchError}
          hasQuery={hasQuery}
        />
      </div>
    </PageTransition>
  );
}

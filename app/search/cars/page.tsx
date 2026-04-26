import { PageTransition } from "@/components/motion/page-transition";
import { CarSearchView } from "@/components/search/car-search-view";
import { searchCarsLive } from "@/lib/booking/cars";
import type { CarResult } from "@/lib/cars/search";

interface PageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

export default async function CarSearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const flightOfferId = typeof sp.flightOfferId === "string" ? sp.flightOfferId : undefined;
  const cabinClass = typeof sp.cabinClass === "string" ? sp.cabinClass : undefined;

  const pickupLocation =
    typeof sp.pickupLocation === "string"
      ? sp.pickupLocation
      : typeof sp.location === "string"
      ? sp.location
      : "";
  const dropoffLocation =
    typeof sp.dropoffLocation === "string" ? sp.dropoffLocation : "";
  const pickupAt = typeof sp.pickupAt === "string" ? sp.pickupAt : "";
  const dropoffAt = typeof sp.dropoffAt === "string" ? sp.dropoffAt : "";
  const category = typeof sp.category === "string" ? sp.category : "";

  // Forward hotel selection params to CarSearchView so they survive re-searches
  const hotelParamKeys = ["hotelId","hotelName","hotelAddress","hotelLat","hotelLng","hotelCheckIn","hotelCheckOut","hotelRating","hotelDistanceKm","hotelAmenities","hotelTotalPrice","hotelCurrency"];
  const hotelParamsObj = new URLSearchParams();
  for (const key of hotelParamKeys) {
    const val = sp[key];
    if (typeof val === "string") hotelParamsObj.set(key, val);
  }
  const hotelParams = hotelParamsObj.toString() || undefined;

  let results: CarResult[] = [];
  let carError: string | null = null;
  const hasQuery = !!pickupLocation && !!pickupAt && !!dropoffAt;
  if (hasQuery) {
    try {
      results = await searchCarsLive({
        location: pickupLocation,
        pickupAt,
        dropoffAt,
      });
    } catch (err) {
      carError = (err as Error).message;
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">Rent a car</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real rental providers powered by Booking.com.
          </p>
        </div>

        {carError && (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {carError}
          </div>
        )}

        <CarSearchView
          defaults={{ pickupLocation, dropoffLocation, pickupAt, dropoffAt, category }}
          flightOfferId={flightOfferId}
          cabinClass={cabinClass}
          hotelParams={hotelParams}
          results={results}
          hasQuery={hasQuery}
        />
      </div>
    </PageTransition>
  );
}

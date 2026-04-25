import { PageTransition } from "@/components/motion/page-transition";
import { CarSearchView } from "@/components/search/car-search-view";
import { searchCarsLive } from "@/lib/booking/cars";
import type { CarResult } from "@/lib/cars/search";
import { getDemoContext } from "@/lib/demo-user";

interface PageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

export default async function CarSearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tripId = typeof sp.tripId === "string" ? sp.tripId : undefined;

  const { supabase, user } = await getDemoContext();

  // Support both old ?location= and new ?pickupLocation= params
  let pickupLocation =
    typeof sp.pickupLocation === "string"
      ? sp.pickupLocation
      : typeof sp.location === "string"
      ? sp.location
      : "";
  let dropoffLocation =
    typeof sp.dropoffLocation === "string" ? sp.dropoffLocation : "";
  let pickupAt = typeof sp.pickupAt === "string" ? sp.pickupAt : "";
  let dropoffAt = typeof sp.dropoffAt === "string" ? sp.dropoffAt : "";
  const category = typeof sp.category === "string" ? sp.category : "";

  if (tripId && (!pickupLocation || !pickupAt || !dropoffAt)) {
    const { data: trip } = await supabase
      .from("trips")
      .select("destination_city, destination_iata, start_date, end_date")
      .eq("id", tripId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (trip) {
      const city = trip.destination_city || trip.destination_iata || "";
      pickupLocation = pickupLocation || city;
      dropoffLocation = dropoffLocation || city;
      pickupAt = pickupAt || (trip.start_date ? `${trip.start_date}T12:00` : "");
      dropoffAt = dropoffAt || (trip.end_date ? `${trip.end_date}T12:00` : "");
    }
  }

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
          tripId={tripId}
          results={results}
          hasQuery={hasQuery}
        />
      </div>
    </PageTransition>
  );
}

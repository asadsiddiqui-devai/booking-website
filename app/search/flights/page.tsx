import { PageTransition } from "@/components/motion/page-transition";
import { FlightSearchForm } from "@/components/search/flight-search-form";
import { FlightResults } from "@/components/search/flight-results";
import { searchFlights } from "@/lib/duffel/flights";
import { flightSearchSchema } from "@/lib/zod/schemas";
import type { FlightOfferDTO } from "@/lib/duffel/types";

interface PageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

export default async function FlightSearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const parsed = flightSearchSchema.safeParse({
    origin: sp.origin,
    destination: sp.destination,
    departureDate: sp.departureDate,
    returnDate: sp.returnDate ?? "",
    passengers: sp.passengers ?? 1,
    cabinClass: sp.cabinClass ?? "economy",
  });

  let offers: FlightOfferDTO[] = [];
  let searchError: string | null = null;
  const hasQuery = !!sp.origin && !!sp.destination;

  if (hasQuery) {
    if (!parsed.success) {
      searchError = "Invalid search parameters.";
    } else {
      try {
        offers = await searchFlights({
          origin: parsed.data.origin,
          destination: parsed.data.destination,
          departureDate: parsed.data.departureDate,
          returnDate: parsed.data.returnDate || undefined,
          passengers: parsed.data.passengers,
          cabinClass: parsed.data.cabinClass,
        });
      } catch (err) {
        searchError = (err as Error).message;
      }
    }
  }

  const expired = sp.expired === "1";

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Find your flight</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real airline prices powered by Duffel.
        </p>

        {expired && (
          <div className="mt-4 rounded-md border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-700 dark:text-yellow-400">
            That offer has expired. Search again to see current availability.
          </div>
        )}

        <div className="mt-6">
          <FlightSearchForm defaults={sp} />
        </div>

        {hasQuery && (
          <div className="mt-8">
            {searchError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {searchError}
              </div>
            ) : (
              <FlightResults offers={offers} passengerCount={parsed.success ? parsed.data.passengers : 1} />
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

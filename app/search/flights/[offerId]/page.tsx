import Link from "next/link";
import { ArrowRight, Plane } from "lucide-react";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/motion/page-transition";
import { getFlightOffer } from "@/lib/duffel/flights";
import { bookFlightAction } from "@/app/actions/trip-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDate,
  formatDuration,
  formatMoney,
  formatTime,
} from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<{ cabinClass?: string; expired?: string }>;
}

export default async function FlightDetailPage({ params, searchParams }: PageProps) {
  const { offerId } = await params;
  const { cabinClass } = await searchParams;

  let offer;
  try {
    offer = await getFlightOffer(
      offerId,
      (cabinClass as "economy" | "premium_economy" | "business" | "first") ?? "economy",
    );
  } catch {
    redirect("/search/flights?expired=1");
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/search/flights" className="text-sm text-muted-foreground hover:text-primary">
          ← Back to results
        </Link>

        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                {offer.airlineLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={offer.airlineLogoUrl} alt={offer.airlineName} className="h-8 w-8 rounded" />
                ) : (
                  <Plane className="h-6 w-6 text-primary" />
                )}
                {offer.airlineName}
              </CardTitle>
              <div className="mt-1 text-sm text-muted-foreground capitalize">
                {offer.cabinClass.replace("_", " ")} · {offer.passengerCount} passenger
                {offer.passengerCount > 1 ? "s" : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatMoney(offer.totalAmount, offer.currency)}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {offer.slices.map((slice, idx) => (
              <div key={idx} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <div className="font-semibold">
                    {slice.origin} → {slice.destination}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{formatDuration(slice.durationMinutes)}</Badge>
                    {slice.stops === 0 ? (
                      <Badge variant="success">Nonstop</Badge>
                    ) : (
                      <Badge variant="warning">{slice.stops} stop{slice.stops > 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {slice.segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm">
                      <div className="w-28">
                        <div className="font-semibold">{formatTime(seg.departureAt)}</div>
                        <div className="text-xs text-muted-foreground">{seg.origin}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(seg.departureAt)}</div>
                      </div>
                      <div className="flex-1 text-center text-xs text-muted-foreground">
                        {seg.airlineName} {seg.flightNumber} · {formatDuration(seg.durationMinutes)}
                        {seg.aircraft && <div>{seg.aircraft}</div>}
                      </div>
                      <div className="w-28 text-right">
                        <div className="font-semibold">{formatTime(seg.arrivalAt)}</div>
                        <div className="text-xs text-muted-foreground">{seg.destination}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(seg.arrivalAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <form action={bookFlightAction} className="flex items-center justify-between gap-4 pt-4">
              <input type="hidden" name="offerId" value={offer.id} />
              <input type="hidden" name="cabinClass" value={offer.cabinClass} />
              <p className="text-xs text-muted-foreground">
                Creates a draft trip and takes you to pick a hotel.
              </p>
              <Button type="submit" size="lg">
                Continue — pick a hotel <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

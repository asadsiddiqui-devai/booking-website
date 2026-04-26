import Link from "next/link";
import { Building2, Car, Check, Plane } from "lucide-react";
import { PageTransition } from "@/components/motion/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationConfetti } from "@/components/trip/confirmation-confetti";
import { formatDate, formatDateTime, formatDuration, formatMoney } from "@/lib/utils/format";

interface PageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export default async function TripSummaryPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const flightOrigin = str(sp.flightOrigin);
  const flightDestination = str(sp.flightDestination);
  const flightDeparture = str(sp.flightDeparture);
  const flightArrival = str(sp.flightArrival);
  const flightAirline = str(sp.flightAirline);
  const flightNumber = str(sp.flightNumber);
  const flightLogoUrl = str(sp.flightLogoUrl);
  const flightPrice = Number(sp.flightPrice ?? 0);
  const flightCurrency = str(sp.flightCurrency) || "USD";
  const flightDuration = Number(sp.flightDuration ?? 0);
  const flightStops = Number(sp.flightStops ?? 0);
  const cabinClass = str(sp.cabinClass) || "economy";

  const hotelName = str(sp.hotelName);
  const hotelAddress = str(sp.hotelAddress);
  const hotelCheckIn = str(sp.hotelCheckIn);
  const hotelCheckOut = str(sp.hotelCheckOut);
  const hotelRating = Number(sp.hotelRating ?? 0);
  const hotelTotalPrice = Number(sp.hotelTotalPrice ?? 0);
  const hotelCurrency = str(sp.hotelCurrency) || "USD";
  const hotelNights = (() => {
    if (!hotelCheckIn || !hotelCheckOut) return 0;
    const ms = new Date(hotelCheckOut).getTime() - new Date(hotelCheckIn).getTime();
    return Math.max(1, Math.round(ms / 86400000));
  })();

  const carProvider = str(sp.carProvider);
  const carCategory = str(sp.carCategory);
  const carExample = str(sp.carExample);
  const pickupLocation = str(sp.pickupLocation);
  const pickupAt = str(sp.pickupAt);
  const dropoffAt = str(sp.dropoffAt);
  const carTotalPrice = Number(sp.carTotalPrice ?? 0);
  const carDailyRate = Number(sp.carDailyRate ?? 0);
  const carTotalDays = Number(sp.carTotalDays ?? 0);

  const totalPrice = Number(sp.totalPrice ?? 0);
  const currency = str(sp.currency) || "USD";

  const hasTrip = !!flightOrigin && !!hotelName && !!carProvider;

  if (!hasTrip) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">No trip yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Search for a flight to start building your trip.
          </p>
          <Link href="/search/flights" className="mt-6 inline-block">
            <Button>Search flights</Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ConfirmationConfetti />

        <div className="mb-2">
          <Badge variant="success" className="gap-1.5">
            <Check className="h-3 w-3" /> Trip confirmed
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold">
          {flightOrigin} → {flightDestination}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulated booking — no real tickets or charges.
        </p>

        <div className="mt-6 space-y-4">
          {/* Flight */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plane className="h-4 w-4 text-primary" /> Flight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                {flightLogoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={flightLogoUrl} alt={flightAirline} className="h-6 w-6 rounded" />
                )}
                <span className="font-semibold">{flightAirline} · {flightNumber}</span>
                <Badge variant="outline" className="capitalize">{cabinClass.replace("_", " ")}</Badge>
                {flightStops === 0 ? (
                  <Badge variant="success">Nonstop</Badge>
                ) : (
                  <Badge variant="warning">{flightStops} stop{flightStops > 1 ? "s" : ""}</Badge>
                )}
              </div>
              <div className="text-muted-foreground">
                {flightOrigin} → {flightDestination}
              </div>
              <div className="text-muted-foreground">
                {formatDateTime(flightDeparture)} → {formatDateTime(flightArrival)}
                {flightDuration > 0 && ` · ${formatDuration(flightDuration)}`}
              </div>
              <div className="font-semibold pt-1">{formatMoney(flightPrice, flightCurrency)}</div>
            </CardContent>
          </Card>

          {/* Hotel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" /> Hotel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{hotelName}</span>
                {hotelRating > 0 && <Badge variant="secondary">{hotelRating} ★</Badge>}
              </div>
              {hotelAddress && <div className="text-muted-foreground">{hotelAddress}</div>}
              <div className="text-muted-foreground">
                {formatDate(hotelCheckIn)} → {formatDate(hotelCheckOut)} · {hotelNights} night{hotelNights > 1 ? "s" : ""}
              </div>
              <div className="font-semibold pt-1">{formatMoney(hotelTotalPrice, hotelCurrency)}</div>
            </CardContent>
          </Card>

          {/* Car */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-4 w-4 text-primary" /> Rental car
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-semibold">{carProvider} · {carCategory}</div>
              {carExample && <div className="text-muted-foreground">{carExample}</div>}
              <div className="text-muted-foreground">
                {formatDateTime(pickupAt)} → {formatDateTime(dropoffAt)}
              </div>
              <div className="text-muted-foreground">Pickup: {pickupLocation}</div>
              <div className="font-semibold pt-1">
                {formatMoney(carTotalPrice)} ({carTotalDays} days · {formatMoney(carDailyRate)}/day)
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total (simulated)</div>
                <div className="text-2xl font-bold">{formatMoney(totalPrice, currency)}</div>
              </div>
              <Link href="/search/flights">
                <Button variant="outline">Book another trip</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

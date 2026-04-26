import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Car, Check, Plane } from "lucide-react";
import { PageTransition } from "@/components/motion/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFlightOffer } from "@/lib/duffel/flights";
import { getCarById } from "@/lib/cars/search";
import { calculatePrice } from "@/lib/cars/pricing";
import { CAR_CATEGORIES, CAR_PROVIDERS } from "@/lib/cars/catalog";
import { formatDate, formatDateTime, formatDuration, formatMoney } from "@/lib/utils/format";

interface PageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

function nightsBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

async function confirmAndRedirect(formData: FormData) {
  "use server";
  // All data is already in URL params — just redirect to summary
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") params.set(key, value);
  }
  redirect(`/trips?${params.toString()}`);
}

export default async function ConfirmPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const flightOfferId = typeof sp.flightOfferId === "string" ? sp.flightOfferId : null;
  const cabinClass = (typeof sp.cabinClass === "string" ? sp.cabinClass : "economy") as
    "economy" | "premium_economy" | "business" | "first";
  const vehicleId = typeof sp.vehicleId === "string" ? sp.vehicleId : null;
  const pickupLocation = typeof sp.pickupLocation === "string" ? sp.pickupLocation : "";
  const pickupAt = typeof sp.pickupAt === "string" ? sp.pickupAt : "";
  const dropoffLocation = typeof sp.dropoffLocation === "string" ? sp.dropoffLocation : "";
  const dropoffAt = typeof sp.dropoffAt === "string" ? sp.dropoffAt : "";
  const hotelId = typeof sp.hotelId === "string" ? sp.hotelId : null;
  const hotelName = typeof sp.hotelName === "string" ? sp.hotelName : "";
  const hotelAddress = typeof sp.hotelAddress === "string" ? sp.hotelAddress : "";
  const hotelCheckIn = typeof sp.hotelCheckIn === "string" ? sp.hotelCheckIn : "";
  const hotelCheckOut = typeof sp.hotelCheckOut === "string" ? sp.hotelCheckOut : "";
  const hotelRating = Number(sp.hotelRating ?? 0);
  const hotelDistanceKm = Number(sp.hotelDistanceKm ?? 0);
  const hotelAmenities = typeof sp.hotelAmenities === "string" ? sp.hotelAmenities : "[]";
  const hotelTotalPrice = Number(sp.hotelTotalPrice ?? 0);
  const hotelCurrency = typeof sp.hotelCurrency === "string" ? sp.hotelCurrency : "USD";
  const hotelLat = typeof sp.hotelLat === "string" ? sp.hotelLat : "0";
  const hotelLng = typeof sp.hotelLng === "string" ? sp.hotelLng : "0";

  if (!flightOfferId || !vehicleId || !hotelId) {
    redirect("/search/flights");
  }

  let offer;
  try {
    offer = await getFlightOffer(flightOfferId, cabinClass);
  } catch {
    redirect("/search/flights?expired=1");
  }

  const carBase = getCarById(vehicleId);
  if (!carBase) redirect("/search/flights");

  const days = daysBetween(pickupAt, dropoffAt);
  const carCategory = CAR_CATEGORIES.find((c) => c.id === carBase.categoryId)!;
  const carProvider = CAR_PROVIDERS.find((p) => p.id === carBase.providerId)!;
  const carPrice = calculatePrice({
    category: carCategory,
    provider: carProvider,
    location: pickupLocation,
    days,
    pickupIso: pickupAt.slice(0, 10),
  });

  const hotelNights = nightsBetween(hotelCheckIn, hotelCheckOut);
  const totalPrice = offer.totalAmount + hotelTotalPrice + carPrice.totalPrice;

  const firstSlice = offer.slices[0];
  const firstSeg = firstSlice.segments[0];
  const lastSeg = firstSlice.segments[firstSlice.segments.length - 1];

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/search/flights" className="text-sm text-muted-foreground hover:text-primary">
          ← Start over
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold">Confirm your trip</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your selections. Click confirm to see your trip summary.
          </p>
        </div>

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
                {offer.airlineLogoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={offer.airlineLogoUrl} alt={offer.airlineName} className="h-6 w-6 rounded" />
                )}
                <span className="font-semibold">{offer.airlineName} · {firstSeg.flightNumber}</span>
                <Badge variant="outline" className="capitalize">{cabinClass.replace("_", " ")}</Badge>
              </div>
              <div className="text-muted-foreground">
                {firstSlice.origin} → {firstSlice.destination}
              </div>
              <div className="text-muted-foreground">
                {formatDateTime(firstSeg.departureAt)} → {formatDateTime(lastSeg.arrivalAt)}
                {" · "}{formatDuration(firstSlice.durationMinutes)}
              </div>
              {offer.slices[1] && (
                <div className="text-muted-foreground text-xs">
                  Return: {offer.slices[1].origin} → {offer.slices[1].destination}
                </div>
              )}
              <div className="font-semibold pt-1">{formatMoney(offer.totalAmount, offer.currency)}</div>
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
              <div className="text-muted-foreground">{hotelAddress}</div>
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
              <div className="font-semibold">{carProvider.name} · {carCategory.label}</div>
              <div className="text-muted-foreground">{carCategory.example}</div>
              <div className="text-muted-foreground">
                {formatDateTime(pickupAt)} → {formatDateTime(dropoffAt)}
              </div>
              <div className="text-muted-foreground">Pickup: {pickupLocation}</div>
              <div className="font-semibold pt-1">
                {formatMoney(carPrice.totalPrice)} ({carPrice.totalDays} days · {formatMoney(carPrice.dailyRate)}/day)
              </div>
            </CardContent>
          </Card>

          {/* Total + confirm */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total estimated cost</div>
                  <div className="text-2xl font-bold">{formatMoney(totalPrice, offer.currency)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Simulated — no real charges
                  </div>
                </div>
                <form action={confirmAndRedirect}>
                  <input type="hidden" name="flightOfferId" value={flightOfferId} />
                  <input type="hidden" name="cabinClass" value={cabinClass} />
                  <input type="hidden" name="flightOrigin" value={firstSlice.origin} />
                  <input type="hidden" name="flightDestination" value={firstSlice.destination} />
                  <input type="hidden" name="flightDeparture" value={firstSeg.departureAt} />
                  <input type="hidden" name="flightArrival" value={lastSeg.arrivalAt} />
                  <input type="hidden" name="flightAirline" value={offer.airlineName} />
                  <input type="hidden" name="flightNumber" value={firstSeg.flightNumber} />
                  <input type="hidden" name="flightLogoUrl" value={offer.airlineLogoUrl ?? ""} />
                  <input type="hidden" name="flightPrice" value={offer.totalAmount} />
                  <input type="hidden" name="flightCurrency" value={offer.currency} />
                  <input type="hidden" name="flightDuration" value={firstSlice.durationMinutes} />
                  <input type="hidden" name="flightStops" value={firstSlice.stops} />
                  <input type="hidden" name="hotelId" value={hotelId} />
                  <input type="hidden" name="hotelName" value={hotelName} />
                  <input type="hidden" name="hotelAddress" value={hotelAddress} />
                  <input type="hidden" name="hotelLat" value={hotelLat} />
                  <input type="hidden" name="hotelLng" value={hotelLng} />
                  <input type="hidden" name="hotelCheckIn" value={hotelCheckIn} />
                  <input type="hidden" name="hotelCheckOut" value={hotelCheckOut} />
                  <input type="hidden" name="hotelRating" value={hotelRating} />
                  <input type="hidden" name="hotelDistanceKm" value={hotelDistanceKm} />
                  <input type="hidden" name="hotelAmenities" value={hotelAmenities} />
                  <input type="hidden" name="hotelTotalPrice" value={hotelTotalPrice} />
                  <input type="hidden" name="hotelCurrency" value={hotelCurrency} />
                  <input type="hidden" name="vehicleId" value={vehicleId} />
                  <input type="hidden" name="carProvider" value={carProvider.name} />
                  <input type="hidden" name="carCategory" value={carCategory.label} />
                  <input type="hidden" name="carExample" value={carCategory.example} />
                  <input type="hidden" name="pickupLocation" value={pickupLocation} />
                  <input type="hidden" name="pickupAt" value={pickupAt} />
                  <input type="hidden" name="dropoffLocation" value={dropoffLocation} />
                  <input type="hidden" name="dropoffAt" value={dropoffAt} />
                  <input type="hidden" name="carTotalPrice" value={carPrice.totalPrice} />
                  <input type="hidden" name="carDailyRate" value={carPrice.dailyRate} />
                  <input type="hidden" name="carTotalDays" value={carPrice.totalDays} />
                  <input type="hidden" name="totalPrice" value={totalPrice} />
                  <input type="hidden" name="currency" value={offer.currency} />
                  <Button type="submit" size="lg" className="gap-2">
                    <Check className="h-4 w-4" /> Confirm trip
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

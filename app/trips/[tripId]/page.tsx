import { redirect } from "next/navigation";
import Link from "next/link";
import { Plane, Building2, Car, Check } from "lucide-react";
import { PageTransition } from "@/components/motion/page-transition";
import { getDemoContext } from "@/lib/demo-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelTripAction } from "@/app/actions/trip-actions";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { ConfirmationConfetti } from "@/components/trip/confirmation-confetti";

interface PageProps {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}

export default async function TripDetailPage({ params, searchParams }: PageProps) {
  const { tripId } = await params;
  const { confirmed } = await searchParams;

  const { supabase, user } = await getDemoContext();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!trip) redirect("/trips");

  const [flights, hotels, cars, payment] = await Promise.all([
    supabase.from("flight_bookings").select("*").eq("trip_id", tripId),
    supabase.from("hotel_bookings").select("*").eq("trip_id", tripId),
    supabase.from("car_bookings").select("*").eq("trip_id", tripId),
    supabase
      .from("payments")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const isCancelled = trip.status === "cancelled";

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {confirmed && <ConfirmationConfetti />}

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  trip.status === "booked"
                    ? "success"
                    : trip.status === "cancelled"
                      ? "outline"
                      : "warning"
                }
                className="capitalize"
              >
                {trip.status}
              </Badge>
              {payment.data && (
                <Badge variant="secondary">
                  Paid · ends in {payment.data.card_last4}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-semibold">
              {trip.origin_iata} → {trip.destination_iata}
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              Total: {formatMoney(Number(trip.total_price ?? 0), trip.currency)}
            </div>
          </div>
          <div className="flex gap-2">
            {trip.status === "draft" && (
              <Link href={`/checkout/${trip.id}`}>
                <Button>Go to checkout</Button>
              </Link>
            )}
            {!isCancelled && (
              <form action={cancelTripAction}>
                <input type="hidden" name="tripId" value={trip.id} />
                <Button type="submit" variant="outline">Cancel trip</Button>
              </form>
            )}
          </div>
        </div>

        {confirmed && (
          <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-semibold">
              <Check className="h-4 w-4" /> Booking confirmed
            </div>
            <div>Reference: {trip.id.slice(0, 8).toUpperCase()}</div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {flights.data?.map((f) => (
            <Card key={f.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plane className="h-4 w-4 text-primary" /> Flight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-semibold">
                  {f.airline_name} {f.flight_number} · {f.origin_iata} → {f.destination_iata}
                </div>
                <div className="text-muted-foreground">
                  {formatDateTime(f.departure_at)} → {formatDateTime(f.arrival_at)}
                </div>
                <div className="text-muted-foreground capitalize">
                  {f.cabin_class.replace("_", " ")} · {f.stops === 0 ? "nonstop" : `${f.stops} stops`}
                </div>
                <div className="text-sm font-semibold">{formatMoney(Number(f.price), f.currency)}</div>
              </CardContent>
            </Card>
          ))}

          {hotels.data?.map((h) => (
            <Card key={h.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" /> Hotel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-semibold">{h.hotel_name}</div>
                <div className="text-muted-foreground">{h.address}</div>
                <div className="text-muted-foreground">
                  {h.check_in} → {h.check_out} · {h.nights} night{h.nights > 1 ? "s" : ""}
                </div>
                <div className="text-sm font-semibold">
                  {formatMoney(Number(h.total_price), h.currency)}
                </div>
              </CardContent>
            </Card>
          ))}

          {cars.data?.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="h-4 w-4 text-primary" /> Rental car
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-semibold">
                  {c.provider_name} · {c.vehicle_category}
                </div>
                <div className="text-muted-foreground">{c.vehicle_example}</div>
                <div className="text-muted-foreground">
                  {formatDateTime(c.pickup_at)} → {formatDateTime(c.dropoff_at)}
                </div>
                <div className="text-muted-foreground">Pickup: {c.pickup_location}</div>
                <div className="text-sm font-semibold">
                  {formatMoney(Number(c.total_price), c.currency)} ({c.total_days} days)
                </div>
              </CardContent>
            </Card>
          ))}

          {flights.data?.length === 0 && hotels.data?.length === 0 && cars.data?.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                This trip has no bookings yet.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 text-sm">
          <Link href="/trips" className="text-muted-foreground hover:text-primary">
            ← All trips
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}

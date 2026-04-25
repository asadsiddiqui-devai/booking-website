import { redirect } from "next/navigation";
import Link from "next/link";
import { PageTransition } from "@/components/motion/page-transition";
import { getDemoContext } from "@/lib/demo-user";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { tripId } = await params;

  const { supabase, user } = await getDemoContext();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!trip) redirect("/trips");

  const [flights, hotels, cars] = await Promise.all([
    supabase.from("flight_bookings").select("*").eq("trip_id", tripId),
    supabase.from("hotel_bookings").select("*").eq("trip_id", tripId),
    supabase.from("car_bookings").select("*").eq("trip_id", tripId),
  ]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulated payment — no real charges. Fill any valid-format card.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_340px]">
          <CheckoutForm tripId={tripId} total={Number(trip.total_price ?? 0)} currency={trip.currency} />

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Trip summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {flights.data?.map((f) => (
                <div key={f.id} className="flex justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">
                      Flight {f.origin_iata} → {f.destination_iata}
                    </div>
                    <div className="text-xs text-muted-foreground">{f.airline_name}</div>
                  </div>
                  <div>{formatMoney(Number(f.price), f.currency)}</div>
                </div>
              ))}
              {hotels.data?.map((h) => (
                <div key={h.id} className="flex justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{h.hotel_name}</div>
                    <div className="text-xs text-muted-foreground">{h.nights} nights</div>
                  </div>
                  <div>{formatMoney(Number(h.total_price), h.currency)}</div>
                </div>
              ))}
              {cars.data?.map((c) => (
                <div key={c.id} className="flex justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{c.provider_name} · {c.vehicle_category}</div>
                    <div className="text-xs text-muted-foreground">{c.total_days} days</div>
                  </div>
                  <div>{formatMoney(Number(c.total_price), c.currency)}</div>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-base font-bold">
                <div>Total</div>
                <div>{formatMoney(Number(trip.total_price ?? 0), trip.currency)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 text-sm">
          <Link href={`/trips/${tripId}`} className="text-muted-foreground hover:text-primary">
            ← Back to trip
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}

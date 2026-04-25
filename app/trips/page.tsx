import Link from "next/link";
import { Plane } from "lucide-react";
import { PageTransition } from "@/components/motion/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDemoContext } from "@/lib/demo-user";
import { formatDate, formatMoney } from "@/lib/utils/format";

export default async function TripsPage() {
  const { supabase, user } = await getDemoContext();

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold">My trips</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All your bookings, grouped by trip.
            </p>
          </div>
          <Link href="/search/flights">
            <Button>New trip</Button>
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {trips && trips.length > 0 ? (
            trips.map((t) => (
              <Link key={t.id} href={`/trips/${t.id}`}>
                <Card className="transition hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Plane className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {t.origin_iata} → {t.destination_iata}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.start_date ? formatDate(t.start_date) : "TBD"}
                          {t.end_date ? ` → ${formatDate(t.end_date)}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          t.status === "booked"
                            ? "success"
                            : t.status === "cancelled"
                              ? "outline"
                              : "warning"
                        }
                        className="capitalize"
                      >
                        {t.status}
                      </Badge>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatMoney(Number(t.total_price ?? 0), t.currency)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No trips yet. Start by searching for a flight.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import type { FlightOfferDTO } from "@/lib/duffel/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatMoney, formatTime } from "@/lib/utils/format";

export function FlightCard({
  offer,
  passengerCount,
}: {
  offer: FlightOfferDTO;
  passengerCount: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md"
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <div className="flex shrink-0 items-center gap-3 md:w-44">
          {offer.airlineLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offer.airlineLogoUrl} alt={offer.airlineName} className="h-8 w-8 rounded" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
              <Plane className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="text-sm font-medium">{offer.airlineName}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {offer.cabinClass.replace("_", " ")}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {offer.slices.map((slice, idx) => {
            const first = slice.segments[0];
            const last = slice.segments[slice.segments.length - 1];
            return (
              <div key={idx} className="flex items-center gap-4">
                <div className="text-sm">
                  <div className="font-semibold">{formatTime(first.departureAt)}</div>
                  <div className="text-xs text-muted-foreground">{slice.origin}</div>
                </div>
                <div className="flex-1">
                  <div className="text-center text-xs text-muted-foreground">
                    {formatDuration(slice.durationMinutes)}
                  </div>
                  <div className="relative my-1 h-px bg-border">
                    <Plane className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <div className="text-center text-xs">
                    {slice.stops === 0 ? (
                      <Badge variant="success">Nonstop</Badge>
                    ) : (
                      <Badge variant="warning">{slice.stops} stop{slice.stops > 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-right">
                  <div className="font-semibold">{formatTime(last.arrivalAt)}</div>
                  <div className="text-xs text-muted-foreground">{slice.destination}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 flex-col items-end md:w-40">
          <div className="text-2xl font-bold">
            {formatMoney(offer.totalAmount, offer.currency)}
          </div>
          <div className="text-xs text-muted-foreground">
            {passengerCount > 1 ? `for ${passengerCount} passengers` : "per person"}
          </div>
          <Link href={`/search/flights/${offer.id}`} className="mt-2">
            <Button size="sm">Select</Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

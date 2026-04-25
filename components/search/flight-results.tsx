"use client";

import { useMemo, useState } from "react";
import { FlightCard } from "@/components/results/flight-card";
import { Button } from "@/components/ui/button";
import type { FlightOfferDTO } from "@/lib/duffel/types";

type SortKey = "price" | "duration" | "stops";

export function FlightResults({
  offers,
  passengerCount,
}: {
  offers: FlightOfferDTO[];
  passengerCount: number;
}) {
  const [sort, setSort] = useState<SortKey>("price");

  const sorted = useMemo(() => {
    const copy = [...offers];
    copy.sort((a, b) => {
      if (sort === "price") return a.totalAmount - b.totalAmount;
      if (sort === "duration") {
        return (
          a.slices.reduce((s, x) => s + x.durationMinutes, 0) -
          b.slices.reduce((s, x) => s + x.durationMinutes, 0)
        );
      }
      return (
        a.slices.reduce((s, x) => s + x.stops, 0) -
        b.slices.reduce((s, x) => s + x.stops, 0)
      );
    });
    return copy;
  }, [offers, sort]);

  if (offers.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
        No flights matched your search. Try different dates or destinations.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {offers.length} offers
        </div>
        <div className="flex gap-2 text-xs">
          {(["price", "duration", "stops"] as SortKey[]).map((k) => (
            <Button
              key={k}
              type="button"
              variant={sort === k ? "default" : "outline"}
              size="sm"
              onClick={() => setSort(k)}
            >
              Sort: {k}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {sorted.map((offer) => (
          <FlightCard key={offer.id} offer={offer} passengerCount={passengerCount} />
        ))}
      </div>
    </div>
  );
}

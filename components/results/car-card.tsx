"use client";

import { motion } from "framer-motion";
import { Users, DoorOpen, Snowflake, GaugeCircle } from "lucide-react";
import { bookCarAction } from "@/app/actions/trip-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";
import type { CarResult } from "@/lib/cars/search";

export function CarCard({
  car,
  tripId,
  pickupLocation,
  dropoffLocation,
  pickupAt,
  dropoffAt,
}: {
  car: CarResult;
  tripId?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupAt: string;
  dropoffAt: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={car.providerLogoUrl}
            alt={car.providerName}
            className="h-8 w-16 object-contain"
          />
          <div>
            <div className="text-xs text-muted-foreground">{car.providerName}</div>
            <div className="font-semibold">{car.categoryLabel}</div>
            <div className="text-xs text-muted-foreground">{car.example}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{formatMoney(car.totalPrice)}</div>
          <div className="text-xs text-muted-foreground">
            {car.totalDays} day{car.totalDays > 1 ? "s" : ""} · {formatMoney(car.dailyRate)}/day
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> {car.seats} seats</Badge>
        <Badge variant="outline" className="gap-1"><DoorOpen className="h-3 w-3" /> {car.doors} doors</Badge>
        <Badge variant="outline" className="gap-1"><GaugeCircle className="h-3 w-3" /> {car.transmission}</Badge>
        {car.airConditioning && (
          <Badge variant="outline" className="gap-1"><Snowflake className="h-3 w-3" /> A/C</Badge>
        )}
      </div>

      {tripId ? (
        <form action={bookCarAction} className="mt-4 flex justify-end">
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="vehicleId" value={car.id} />
          <input type="hidden" name="pickupLocation" value={pickupLocation} />
          <input type="hidden" name="pickupAt" value={pickupAt} />
          <input type="hidden" name="dropoffLocation" value={dropoffLocation} />
          <input type="hidden" name="dropoffAt" value={dropoffAt} />
          <Button type="submit" size="sm">Add to trip</Button>
        </form>
      ) : (
        <div className="mt-4 text-right text-xs text-muted-foreground">
          Start from a flight to add this to a trip.
        </div>
      )}
    </motion.div>
  );
}

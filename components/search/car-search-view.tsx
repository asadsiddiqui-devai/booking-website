"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CarCard } from "@/components/results/car-card";
import type { CarResult } from "@/lib/cars/search";

interface Defaults {
  pickupLocation: string;
  dropoffLocation: string;
  pickupAt: string;
  dropoffAt: string;
  category: string;
}

function splitDateTime(iso: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const [date, time] = iso.split("T");
  return { date: date ?? "", time: (time ?? "").slice(0, 5) };
}

function joinDateTime(date: string, time: string): string {
  if (!date) return "";
  return `${date}T${time || "12:00"}`;
}

export function CarSearchView({
  defaults,
  flightOfferId,
  cabinClass,
  hotelParams,
  results,
  hasQuery,
}: {
  defaults: Defaults;
  flightOfferId?: string;
  cabinClass?: string;
  hotelParams?: string;
  results: CarResult[];
  hasQuery: boolean;
}) {
  const router = useRouter();

  const [pickupLocation, setPickupLocation] = useState(defaults.pickupLocation);
  const [dropoffLocation, setDropoffLocation] = useState(
    defaults.dropoffLocation || defaults.pickupLocation
  );

  const pickupSplit = splitDateTime(defaults.pickupAt);
  const dropoffSplit = splitDateTime(defaults.dropoffAt);

  const [pickupDate, setPickupDate] = useState(pickupSplit.date);
  const [pickupTime, setPickupTime] = useState(pickupSplit.time || "12:00");
  const [dropoffDate, setDropoffDate] = useState(dropoffSplit.date);
  const [dropoffTime, setDropoffTime] = useState(dropoffSplit.time || "12:00");
  const [category, setCategory] = useState(defaults.category);

  const pickupAt = joinDateTime(pickupDate, pickupTime);
  const dropoffAt = joinDateTime(dropoffDate, dropoffTime);

  const canSearch = !!pickupLocation && !!pickupDate && !!dropoffDate;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({
      pickupLocation,
      dropoffLocation: dropoffLocation || pickupLocation,
      pickupAt,
      dropoffAt,
    });
    if (category) q.set("category", category);
    if (flightOfferId) q.set("flightOfferId", flightOfferId);
    if (cabinClass) q.set("cabinClass", cabinClass);
    if (hotelParams) {
      new URLSearchParams(hotelParams).forEach((v, k) => q.set(k, v));
    }
    router.push(`/search/cars?${q.toString()}`);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6">
        {/* Main search card */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {/* Pickup / Dropoff row */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Pickup */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Pick-up
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Location</label>
                <input
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="City, airport or address"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition [color-scheme:dark]"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Time</label>
                  <input
                    type="time"
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition [color-scheme:dark]"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Drop-off */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                Drop-off
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Location</label>
                <input
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="Same as pick-up"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition [color-scheme:dark]"
                    value={dropoffDate}
                    onChange={(e) => setDropoffDate(e.target.value)}
                    min={pickupDate}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Time</label>
                  <input
                    type="time"
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition [color-scheme:dark]"
                    value={dropoffTime}
                    onChange={(e) => setDropoffTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar: category + search */}
          <div className="flex items-center gap-3 px-5 py-3 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2 flex-1">
              <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent border-0 focus:ring-0 text-sm py-0 h-auto"
              >
                <option value="">Any category</option>
                <option value="economy">Economy</option>
                <option value="compact">Compact</option>
                <option value="midsize">Midsize</option>
                <option value="fullsize">Fullsize</option>
                <option value="suv">SUV</option>
                <option value="luxury">Luxury</option>
                <option value="van">Van</option>
                <option value="convertible">Convertible</option>
              </Select>
            </div>
            <Button type="submit" disabled={!canSearch} className="gap-2 shrink-0">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </form>

      {hasQuery && results.length === 0 && (
        <div className="mt-6 rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No vehicles for this query — try a different category or dates.
        </div>
      )}

      {hasQuery && results.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="text-sm text-muted-foreground">{results.length} vehicles available</div>
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((r) => (
              <CarCard
                key={r.id}
                car={r}
                flightOfferId={flightOfferId}
                cabinClass={cabinClass}
                hotelParams={hotelParams}
                pickupLocation={pickupLocation}
                dropoffLocation={dropoffLocation || pickupLocation}
                pickupAt={pickupAt}
                dropoffAt={dropoffAt}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

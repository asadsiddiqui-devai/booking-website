"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { HotelCard } from "@/components/results/hotel-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HotelOfferDTO } from "@/lib/duffel/types";

const HotelMap = dynamic(() => import("@/components/map/hotel-map").then((m) => m.HotelMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full" />,
});

interface Defaults {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export function HotelSearchView({
  defaults,
  tripId,
  results,
  center,
  error,
  hasQuery,
}: {
  defaults: Defaults;
  tripId?: string;
  results: HotelOfferDTO[];
  center: { lat: number; lng: number; name: string } | null;
  error: string | null;
  hasQuery: boolean;
}) {
  const router = useRouter();
  const [city, setCity] = useState(defaults.city);
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [guests, setGuests] = useState(defaults.guests);
  const [rooms, setRooms] = useState(defaults.rooms);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return results.filter((h) => {
      if (minRating > 0 && (h.rating ?? 0) < minRating) return false;
      if (maxPrice !== undefined && h.totalPrice > maxPrice) return false;
      return true;
    });
  }, [results, minRating, maxPrice]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({
      city,
      checkIn,
      checkOut,
      guests: String(guests),
      rooms: String(rooms),
    });
    if (tripId) q.set("tripId", tripId);
    router.push(`/search/hotels?${q.toString()}`);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1.5 md:col-span-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. London" />
          </div>
          <div className="space-y-1.5">
            <Label>Check-in</Label>
            <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Check-out</Label>
            <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Guests / Rooms</Label>
            <div className="flex gap-2">
              <Select value={String(guests)} onChange={(e) => setGuests(Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => (<option key={n} value={n}>{n}</option>))}
              </Select>
              <Select value={String(rooms)} onChange={(e) => setRooms(Number(e.target.value))}>
                {[1, 2, 3].map((n) => (<option key={n} value={n}>{n}</option>))}
              </Select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={!city || !checkIn || !checkOut}>
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {hasQuery && !error && results.length === 0 && (
        <div className="mt-6 rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
          No hotels matched. Try different dates or a nearby city.
        </div>
      )}

      {hasQuery && results.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground">{filtered.length} of {results.length} hotels</span>
              <Select
                value={String(minRating)}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="h-8 w-auto"
              >
                <option value="0">Any rating</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="5">5 stars</option>
              </Select>
              <Select
                value={maxPrice ? String(maxPrice) : ""}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                className="h-8 w-auto"
              >
                <option value="">Any price</option>
                <option value="200">Under $200</option>
                <option value="500">Under $500</option>
                <option value="1000">Under $1000</option>
              </Select>
            </div>
            <div className="space-y-3">
              {filtered.map((h) => (
                <HotelCard
                  key={h.id}
                  hotel={h}
                  tripId={tripId}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onHover={setHoveredId}
                />
              ))}
            </div>
          </div>
          <div className="sticky top-20 hidden h-[calc(100vh-7rem)] lg:block">
            {center && (
              <HotelMap
                center={[center.lat, center.lng]}
                hotels={filtered}
                highlightId={hoveredId}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

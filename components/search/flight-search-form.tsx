"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PlaceAutocomplete } from "./place-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function tomorrow(offsetDays = 14) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function FlightSearchForm({
  defaults,
}: {
  defaults: { [k: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState(String(defaults.origin ?? ""));
  const [originLabel, setOriginLabel] = useState(String(defaults.origin ?? ""));
  const [destination, setDestination] = useState(String(defaults.destination ?? ""));
  const [destinationLabel, setDestinationLabel] = useState(String(defaults.destination ?? ""));
  const [departureDate, setDepartureDate] = useState(
    String(defaults.departureDate ?? tomorrow(14)),
  );
  const [returnDate, setReturnDate] = useState(
    String(defaults.returnDate ?? tomorrow(21)),
  );
  const [passengers, setPassengers] = useState(Number(defaults.passengers ?? 1));
  const [cabinClass, setCabinClass] = useState(String(defaults.cabinClass ?? "economy"));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers: String(passengers),
      cabinClass,
    });
    router.push(`/search/flights?${q.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>From</Label>
          <PlaceAutocomplete value={originLabel} onSelect={(iata, label) => { setOrigin(iata); setOriginLabel(label ?? iata); }} placeholder="City or airport" />
        </div>
        <div className="space-y-1.5">
          <Label>To</Label>
          <PlaceAutocomplete value={destinationLabel} onSelect={(iata, label) => { setDestination(iata); setDestinationLabel(label ?? iata); }} placeholder="City or airport" />
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Depart</Label>
          <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Return</Label>
          <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Passengers</Label>
          <Select value={String(passengers)} onChange={(e) => setPassengers(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Cabin</Label>
          <Select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)}>
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={!origin || !destination}>
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>
    </form>
  );
}

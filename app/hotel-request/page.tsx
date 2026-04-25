"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Send,
  Utensils,
  Coffee,
  CarFront,
  PlaneLanding,
  PlaneTakeoff,
  Check,
} from "lucide-react";
import { PageTransition } from "@/components/motion/page-transition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const HOTEL_STAFF_EMAIL = "hotel-booking@company.com";

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type Extras = {
  breakfast: boolean;
  meals: boolean;
  airportPickup: boolean;
  airportDrop: boolean;
};

export default function HotelRequestPage() {
  const [employeeName, setEmployeeName] = useState("");
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState(todayPlus(14));
  const [checkOut, setCheckOut] = useState(todayPlus(17));
  const [guests, setGuests] = useState(1);
  const [extras, setExtras] = useState<Extras>({
    breakfast: false,
    meals: false,
    airportPickup: false,
    airportDrop: false,
  });
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nights = useMemo(() => {
    const a = new Date(checkIn).getTime();
    const b = new Date(checkOut).getTime();
    if (!a || !b || b <= a) return 0;
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const canSubmit =
    employeeName.trim() && city.trim() && checkIn && checkOut && nights > 0;

  function toggleExtra(key: keyof Extras) {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildEmailBody() {
    const lines: string[] = [];
    lines.push(`Hotel request from: ${employeeName}`);
    lines.push(`City: ${city}`);
    lines.push(`Check-in: ${checkIn}`);
    lines.push(`Check-out: ${checkOut}`);
    lines.push(`Nights: ${nights}`);
    lines.push(`Guests: ${guests}`);
    lines.push("");
    lines.push("Extras:");
    lines.push(`  Breakfast included: ${extras.breakfast ? "Yes" : "No"}`);
    lines.push(`  Meals included: ${extras.meals ? "Yes" : "No"}`);
    lines.push(`  Airport pick-up: ${extras.airportPickup ? "Yes" : "No"}`);
    lines.push(`  Airport drop-off: ${extras.airportDrop ? "Yes" : "No"}`);
    if (notes.trim()) {
      lines.push("");
      lines.push("Notes:");
      lines.push(notes.trim());
    }
    return lines.join("\n");
  }

  function sendEmail() {
    const subject = `Hotel request – ${employeeName} – ${city} (${checkIn} to ${checkOut})`;
    const body = buildEmailBody();
    const href = `mailto:${HOTEL_STAFF_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Employee hotel request
            </h1>
            <p className="text-sm text-muted-foreground">
              Submit hotel preferences. Your request is sent to the hotel booking team.
            </p>
          </div>
        </div>

        {submitted ? (
          <HotelSummary
            employeeName={employeeName}
            city={city}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            guests={guests}
            extras={extras}
            notes={notes}
            onSend={sendEmail}
            onEdit={() => setSubmitted(false)}
          />
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-8 rounded-2xl border bg-muted/30 p-4 sm:p-6"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="employee-name">Employee name</Label>
                <Input
                  id="employee-name"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Destination city"
                  required
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Check-in</Label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Check-out</Label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Guests</Label>
                <Select
                  value={String(guests)}
                  onChange={(e) => setGuests(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <Label>Meals</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <ExtraToggle
                  icon={Coffee}
                  label="Breakfast included"
                  checked={extras.breakfast}
                  onToggle={() => toggleExtra("breakfast")}
                />
                <ExtraToggle
                  icon={Utensils}
                  label="Meals included"
                  checked={extras.meals}
                  onToggle={() => toggleExtra("meals")}
                />
              </div>
            </div>

            <div className="mt-6">
              <Label>Airport transfer</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <ExtraToggle
                  icon={PlaneLanding}
                  label="Airport pick-up"
                  checked={extras.airportPickup}
                  onToggle={() => toggleExtra("airportPickup")}
                />
                <ExtraToggle
                  icon={PlaneTakeoff}
                  label="Airport drop-off"
                  checked={extras.airportDrop}
                  onToggle={() => toggleExtra("airportDrop")}
                />
              </div>
            </div>

            <div className="mt-6 space-y-1.5">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Accessibility, room preference, late arrival, etc."
                className="flex w-full rounded-md border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "Pick valid dates"}
              </div>
              <Button type="submit" size="lg" disabled={!canSubmit}>
                Submit request <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageTransition>
  );
}

function ExtraToggle({
  icon: Icon,
  label,
  checked,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition ${
        checked
          ? "border-primary ring-2 ring-primary/30"
          : "hover:border-foreground/30"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
          checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-md border text-primary-foreground ${
          checked ? "border-primary bg-primary" : "border-input bg-background"
        }`}
        aria-hidden
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

function HotelSummary({
  employeeName,
  city,
  checkIn,
  checkOut,
  nights,
  guests,
  extras,
  notes,
  onSend,
  onEdit,
}: {
  employeeName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  extras: Extras;
  notes: string;
  onSend: () => void;
  onEdit: () => void;
}) {
  const extraItems: { label: string; on: boolean; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "Breakfast included", on: extras.breakfast, icon: Coffee },
    { label: "Meals included", on: extras.meals, icon: Utensils },
    { label: "Airport pick-up", on: extras.airportPickup, icon: PlaneLanding },
    { label: "Airport drop-off", on: extras.airportDrop, icon: PlaneTakeoff },
  ];

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-muted/40 p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Booking summary
        </div>
        <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
          <span>{city}</span>
          <span className="text-muted-foreground">·</span>
          <span>
            {nights} night{nights > 1 ? "s" : ""}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {employeeName} · {guests} {guests === 1 ? "guest" : "guests"}
        </div>
      </div>
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="flex items-center gap-3 border-b p-5 sm:border-b-0 sm:border-r">
          <CarFront className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Check-in
            </div>
            <div className="font-medium">{checkIn}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-5">
          <CarFront className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Check-out
            </div>
            <div className="font-medium">{checkOut}</div>
          </div>
        </div>
      </div>
      <div className="border-t p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Extras
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {extraItems.map((x) => (
            <li
              key={x.label}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                x.on ? "bg-primary/5 text-foreground" : "text-muted-foreground"
              }`}
            >
              <x.icon className="h-4 w-4" />
              <span className="flex-1">{x.label}</span>
              <span className="text-xs font-medium">{x.on ? "Yes" : "No"}</span>
            </li>
          ))}
        </ul>
      </div>
      {notes.trim() && (
        <div className="border-t p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Notes
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{notes}</p>
        </div>
      )}
      <div className="flex flex-col gap-3 border-t bg-muted/30 p-5 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onEdit}>
          Edit request
        </Button>
        <Button onClick={onSend}>
          <Send className="h-4 w-4" /> Send to hotel booking staff
        </Button>
      </div>
    </div>
  );
}

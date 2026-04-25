"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X, ArrowRight, Send, ArrowLeft, Plane } from "lucide-react";
import { PageTransition } from "@/components/motion/page-transition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const TRAVEL_AGENT_EMAIL = "travel-agent@company.com";
const MAX_FLIGHTS = 6;

type Flight = {
  id: number;
  from: string;
  to: string;
  date: string;
  time: string;
};

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function newFlight(id: number, offsetDays = 14): Flight {
  return { id, from: "", to: "", date: todayPlus(offsetDays), time: "any" };
}

const TIME_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "morning", label: "Morning (06:00 – 12:00)" },
  { value: "afternoon", label: "Afternoon (12:00 – 18:00)" },
  { value: "evening", label: "Evening (18:00 – 24:00)" },
];

function timeLabel(v: string) {
  return TIME_OPTIONS.find((t) => t.value === v)?.label ?? v;
}

export default function TravelRequestPage() {
  const [flights, setFlights] = useState<Flight[]>([newFlight(1, 14)]);
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState("economy");
  const [employeeName, setEmployeeName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(
    () =>
      employeeName.trim().length > 0 &&
      flights.every((f) => f.from.trim() && f.to.trim() && f.date),
    [employeeName, flights],
  );

  function updateFlight(id: number, patch: Partial<Flight>) {
    setFlights((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function addFlight() {
    if (flights.length >= MAX_FLIGHTS) return;
    const nextId = Math.max(...flights.map((f) => f.id)) + 1;
    setFlights([...flights, newFlight(nextId, 14 + flights.length * 7)]);
  }

  function removeFlight(id: number) {
    if (flights.length <= 1) return;
    setFlights((prev) => prev.filter((f) => f.id !== id));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildEmailBody() {
    const lines: string[] = [];
    lines.push(`Travel request from: ${employeeName}`);
    lines.push(`Passengers: ${passengers}`);
    lines.push(`Class: ${cabinClass.replace("_", " ")}`);
    lines.push("");
    lines.push("Itinerary:");
    flights.forEach((f, i) => {
      lines.push(
        `  Flight ${i + 1}: ${f.from} → ${f.to} on ${f.date} (${timeLabel(f.time)})`,
      );
    });
    if (notes.trim()) {
      lines.push("");
      lines.push("Notes:");
      lines.push(notes.trim());
    }
    return lines.join("\n");
  }

  function sendEmail() {
    const subject = `Travel request – ${employeeName} (${flights.length} flight${flights.length > 1 ? "s" : ""})`;
    const body = buildEmailBody();
    const href = `mailto:${TRAVEL_AGENT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Employee travel request
            </h1>
            <p className="text-sm text-muted-foreground">
              Submit flight details for one or multiple trips. Your request is sent to
              the travel agent.
            </p>
          </div>
        </div>

        {submitted ? (
          <SummaryView
            employeeName={employeeName}
            flights={flights}
            passengers={passengers}
            cabinClass={cabinClass}
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
            </div>

            <div className="mt-6 space-y-4">
              {flights.map((f, idx) => (
                <div
                  key={f.id}
                  className="rounded-xl border bg-card p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-muted-foreground">
                      Flight {idx + 1}
                    </div>
                    {flights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFlight(f.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label={`Remove flight ${idx + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label>From city</Label>
                      <Input
                        value={f.from}
                        onChange={(e) => updateFlight(f.id, { from: e.target.value })}
                        placeholder="Departure city"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>To city</Label>
                      <Input
                        value={f.to}
                        onChange={(e) => updateFlight(f.id, { to: e.target.value })}
                        placeholder="Arrival city"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={f.date}
                        onChange={(e) => updateFlight(f.id, { date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Preferred time</Label>
                      <Select
                        value={f.time}
                        onChange={(e) => updateFlight(f.id, { time: e.target.value })}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addFlight}
              disabled={flights.length >= MAX_FLIGHTS}
              className="mt-4 inline-flex items-center gap-3 rounded-full px-2 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card">
                <Plus className="h-4 w-4" />
              </span>
              Add a flight
            </button>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Passengers</Label>
                <Select
                  value={String(passengers)}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "passenger" : "passengers"}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                >
                  <option value="economy">Economy Class</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business Class</option>
                  <option value="first">First Class</option>
                </Select>
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!canSubmit}
                >
                  Submit request <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Baggage, accessibility, visa help, etc."
                className="flex w-full rounded-md border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </form>
        )}
      </div>
    </PageTransition>
  );
}

function SummaryView({
  employeeName,
  flights,
  passengers,
  cabinClass,
  notes,
  onSend,
  onEdit,
}: {
  employeeName: string;
  flights: Flight[];
  passengers: number;
  cabinClass: string;
  notes: string;
  onSend: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-muted/40 p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Request summary
        </div>
        <div className="mt-1 text-lg font-semibold">
          {flights.length} flight{flights.length > 1 ? "s" : ""} for {employeeName}
        </div>
        <div className="text-sm text-muted-foreground">
          {passengers} {passengers === 1 ? "passenger" : "passengers"} · {cabinClass.replace("_", " ")}
        </div>
      </div>
      <ol className="divide-y">
        {flights.map((f, idx) => (
          <li key={f.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground sm:w-20">
              Flight {idx + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-base font-semibold">
                <span>{f.from}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span>{f.to}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {f.date} · {timeLabel(f.time)}
              </div>
            </div>
          </li>
        ))}
      </ol>
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
          <Send className="h-4 w-4" /> Send to travel agent
        </Button>
      </div>
    </div>
  );
}

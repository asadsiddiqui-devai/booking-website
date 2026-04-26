"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X, ArrowRight, ArrowLeft, Plane, CheckCircle, Loader2, User, Users } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/motion/page-transition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { TravelRequest } from "@/lib/types";

const AGENT_EMAIL_KEY = "wanderly_travel_agent_email";
const MAX_FLIGHTS = 6;

type Flight = { id: number; from: string; to: string; date: string };

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function newFlight(id: number, offsetDays = 14): Flight {
  return { id, from: "", to: "", date: todayPlus(offsetDays) };
}

export default function TravelRequestPage() {
  const [flights, setFlights] = useState<Flight[]>([newFlight(1, 14)]);
  const [passengers, setPassengers] = useState(1);
  const [passengerNames, setPassengerNames] = useState<string[]>([""]);
  const [guestName, setGuestName] = useState("");
  const [travelAgentEmail, setTravelAgentEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<TravelRequest | null>(null);

  // Pre-fill saved agent email
  useEffect(() => {
    const saved = localStorage.getItem(AGENT_EMAIL_KEY) ?? "";
    setTravelAgentEmail(saved);
  }, []);

  // Sync passenger names array length to passenger count
  function handlePassengersChange(n: number) {
    setPassengers(n);
    setPassengerNames((prev) => {
      if (n > prev.length) return [...prev, ...Array(n - prev.length).fill("")];
      return prev.slice(0, n);
    });
  }

  const canSubmit = useMemo(
    () =>
      guestName.trim().length > 0 &&
      travelAgentEmail.trim().length > 0 &&
      passengerNames.every((n) => n.trim().length > 0) &&
      flights.every((f) => f.from.trim() && f.to.trim() && f.date),
    [guestName, travelAgentEmail, passengerNames, flights]
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/travel-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName,
          passenger_names: passengerNames,
          legs: flights.map((f) => ({ from: f.from, to: f.to, date: f.date })),
          travel_agent_email: travelAgentEmail,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to submit request");
      }

      // Save agent email for next time
      localStorage.setItem(AGENT_EMAIL_KEY, travelAgentEmail);

      if (json.warning) {
        toast.warning("Request saved — email notification may have failed");
      } else {
        toast.success("Request submitted and travel agent notified!");
      }

      setSubmittedRequest(json.data as TravelRequest);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFlights([newFlight(1, 14)]);
    setPassengers(1);
    setPassengerNames([""]);
    setGuestName("");
    setNotes("");
    setSubmittedRequest(null);
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
              Travel Request
            </h1>
            <p className="text-sm text-muted-foreground">
              Submit flight details — a notification is sent to the travel agent for approval.
            </p>
          </div>
        </div>

        {submittedRequest ? (
          <SuccessView request={submittedRequest} onNew={resetForm} />
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-6" suppressHydrationWarning>
            {/* Guest + Agent email */}
            <div className="rounded-2xl border bg-muted/30 p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Request Details
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="guest-name">
                    <User className="inline h-3.5 w-3.5 mr-1" />
                    Guest name
                  </Label>
                  <Input
                    id="guest-name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Full name of the guest"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="agent-email">Travel agent email</Label>
                  <Input
                    id="agent-email"
                    type="email"
                    value={travelAgentEmail}
                    onChange={(e) => setTravelAgentEmail(e.target.value)}
                    placeholder="agent@example.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Notification email with Accept/Reject buttons sent here
                  </p>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="rounded-2xl border bg-muted/30 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <Users className="inline h-3.5 w-3.5 mr-1" />
                  Passengers
                </h2>
                <Select
                  value={String(passengers)}
                  onChange={(e) => handlePassengersChange(Number(e.target.value))}
                  className="w-40"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "passenger" : "passengers"}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {passengerNames.map((name, i) => (
                  <div key={i} className="space-y-1.5">
                    <Label htmlFor={`passenger-${i}`}>Passenger {i + 1} name</Label>
                    <Input
                      id={`passenger-${i}`}
                      value={name}
                      onChange={(e) =>
                        setPassengerNames((prev) =>
                          prev.map((n, idx) => (idx === i ? e.target.value : n))
                        )
                      }
                      placeholder={`Full name`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Flights */}
            <div className="rounded-2xl border bg-muted/30 p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Flights
              </h2>
              <div className="space-y-4">
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
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
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
                        <Label>Departure date</Label>
                        <Input
                          type="date"
                          value={f.date}
                          onChange={(e) => updateFlight(f.id, { date: e.target.value })}
                          required
                        />
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
                suppressHydrationWarning
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card">
                  <Plus className="h-4 w-4" />
                </span>
                Add another flight
              </button>
            </div>

            {/* Notes */}
            <div className="rounded-2xl border bg-muted/30 p-4 sm:p-6">
              <div className="space-y-1.5">
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
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit || loading}
                className="min-w-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit request <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageTransition>
  );
}

function SuccessView({
  request,
  onNew,
}: {
  request: TravelRequest;
  onNew: () => void;
}) {
  function formatDate(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-emerald-50 dark:bg-emerald-950/30 p-5 flex items-center gap-3">
        <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
        <div>
          <div className="font-semibold text-emerald-800 dark:text-emerald-400">
            Request #{request.request_number} submitted
          </div>
          <div className="text-sm text-emerald-700 dark:text-emerald-500">
            Travel agent notified — awaiting approval
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Guest</div>
            <div className="font-medium">{request.guest_name}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Passengers</div>
            <div className="space-y-0.5">
              {request.passenger_names.map((name, i) => (
                <div key={i} className="text-sm">{i + 1}. {name}</div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Itinerary</div>
          <ol className="space-y-2">
            {request.legs.map((leg, i) => (
              <li key={i} className="flex items-center gap-2 text-sm rounded-lg border bg-muted/30 px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">Trip {i + 1}</span>
                <span className="font-medium">{leg.from}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium">{leg.to}</span>
                <span className="ml-auto text-muted-foreground">{formatDate(leg.date)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t bg-muted/30 p-5 sm:flex-row sm:justify-end">
        <Button onClick={onNew}>Submit another request</Button>
      </div>
    </div>
  );
}

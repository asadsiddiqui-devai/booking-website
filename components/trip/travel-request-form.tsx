"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle, Loader2, SendHorizonal, User, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TravelRequest } from "@/lib/types";

const AGENT_EMAIL_KEY = "wanderly_travel_agent_email";

interface Props {
  flightOrigin: string;
  flightDestination: string;
  flightDeparture: string; // ISO datetime
}

export function TravelRequestForm({ flightOrigin, flightDestination, flightDeparture }: Props) {
  const [guestName, setGuestName] = useState("");
  const [travelAgentEmail, setTravelAgentEmail] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [passengerNames, setPassengerNames] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<TravelRequest | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(AGENT_EMAIL_KEY) ?? "";
    setTravelAgentEmail(saved);
  }, []);

  function handlePassengersChange(n: number) {
    setPassengers(n);
    setPassengerNames((prev) => {
      if (n > prev.length) return [...prev, ...Array(n - prev.length).fill("")];
      return prev.slice(0, n);
    });
  }

  const departureDate = flightDeparture.slice(0, 10);

  const canSubmit = useMemo(
    () =>
      guestName.trim().length > 0 &&
      travelAgentEmail.trim().length > 0 &&
      passengerNames.every((n) => n.trim().length > 0),
    [guestName, travelAgentEmail, passengerNames]
  );

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
          legs: [{ from: flightOrigin, to: flightDestination, date: departureDate }],
          travel_agent_email: travelAgentEmail,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to submit request");
      }

      localStorage.setItem(AGENT_EMAIL_KEY, travelAgentEmail);

      if (json.warning) {
        toast.warning("Request saved — email notification may have failed");
      } else {
        toast.success("Request submitted and travel agent notified!");
      }

      setSubmitted(json.data as TravelRequest);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
        <CardContent className="p-5 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-800 dark:text-emerald-400">
              Travel Request #{submitted.request_number} submitted
            </div>
            <div className="text-sm text-emerald-700 dark:text-emerald-500 mt-0.5">
              Travel agent notified at {submitted.travel_agent_email} — awaiting approval.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <SendHorizonal className="h-4 w-4 text-primary" /> Submit Travel Request
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Auto-filled from your confirmed booking. Add names and agent email to send for approval.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Pre-filled flight info (read-only) */}
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Flight leg (auto-filled)</div>
            <div className="font-medium">
              {flightOrigin} <ArrowRight className="inline h-3.5 w-3.5 mx-1" /> {flightDestination}
              <span className="ml-2 text-muted-foreground font-normal">{departureDate}</span>
            </div>
          </div>

          {/* Guest + agent email */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="req-guest-name">
                <User className="inline h-3.5 w-3.5 mr-1" />
                Guest name
              </Label>
              <Input
                id="req-guest-name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Full name of the guest"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-agent-email">Travel agent email</Label>
              <Input
                id="req-agent-email"
                type="email"
                value={travelAgentEmail}
                onChange={(e) => setTravelAgentEmail(e.target.value)}
                placeholder="agent@example.com"
                required
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                <Users className="inline h-3.5 w-3.5 mr-1" />
                Passengers
              </Label>
              <Select
                value={String(passengers)}
                onChange={(e) => handlePassengersChange(Number(e.target.value))}
                className="w-36"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "passenger" : "passengers"}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {passengerNames.map((name, i) => (
                <div key={i} className="space-y-1">
                  <Label htmlFor={`req-passenger-${i}`} className="text-xs text-muted-foreground">
                    Passenger {i + 1}
                  </Label>
                  <Input
                    id={`req-passenger-${i}`}
                    value={name}
                    onChange={(e) =>
                      setPassengerNames((prev) =>
                        prev.map((n, idx) => (idx === i ? e.target.value : n))
                      )
                    }
                    placeholder="Full name"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="req-notes" className="text-xs text-muted-foreground">Notes (optional)</Label>
            <textarea
              id="req-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Baggage, accessibility, visa help, etc."
              className="flex w-full rounded-md border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit || loading}>
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
      </CardContent>
    </Card>
  );
}

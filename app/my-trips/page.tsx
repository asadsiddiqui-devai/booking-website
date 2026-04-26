"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Car, Plane, Trash2, MapPin, ClipboardList, ArrowRight } from "lucide-react";
import { PageTransition } from "@/components/motion/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTrips, deleteTrip, type SavedTrip } from "@/lib/trips-storage";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils/format";
import type { TravelRequest } from "@/lib/types";

type Tab = "booked" | "requests";

export default function MyTripsPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("booked");
  const [allRequests, setAllRequests] = useState<TravelRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    setTrips(getTrips());
    setLoaded(true);
  }, []);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/travel-requests");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: TravelRequest[] = await res.json();
      setAllRequests(data);
    } catch {
      // silently fail — user can switch tabs again
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "requests") fetchRequests();
  }, [tab, fetchRequests]);

  const pendingRequests = allRequests.filter((r) => r.status === "pending");
  const confirmedRequests = allRequests.filter((r) => r.status === "accepted");
  const rejectedRequests = allRequests.filter((r) => r.status === "rejected");

  function handleDelete(id: string) {
    deleteTrip(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }

  if (!loaded) return null;

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">My Trips</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your booked trips and confirmed travel requests
            </p>
          </div>
          <Link href="/search/flights">
            <Button>Book a trip</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
          <button
            onClick={() => setTab("booked")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              tab === "booked"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plane className="inline h-3.5 w-3.5 mr-1.5" />
            Booked Trips
            {trips.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {trips.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              tab === "requests"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="inline h-3.5 w-3.5 mr-1.5" />
            Travel Requests
            {allRequests.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {allRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Booked Trips tab */}
        {tab === "booked" && (
          <>
            {trips.length === 0 ? (
              <div className="mt-16 flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-muted p-6">
                  <Plane className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Confirm a trip and it will appear here.
                </p>
                <Link href="/search/flights">
                  <Button variant="outline">Search flights</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Travel Requests tab */}
        {tab === "requests" && (
          <>
            {requestsLoading ? (
              <div className="mt-16 flex flex-col items-center gap-2 text-center text-muted-foreground">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm">Loading travel requests…</p>
              </div>
            ) : allRequests.length === 0 ? (
              <div className="mt-16 flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-muted p-6">
                  <ClipboardList className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No travel requests yet.
                </p>
                <Link href="/travel-request">
                  <Button variant="outline">Submit a travel request</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                {pendingRequests.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Pending
                    </h2>
                    <div className="space-y-4">
                      {pendingRequests.map((req) => (
                        <RequestCard key={req.id} request={req} />
                      ))}
                    </div>
                  </section>
                )}
                {confirmedRequests.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Confirmed
                    </h2>
                    <div className="space-y-4">
                      {confirmedRequests.map((req) => (
                        <RequestCard key={req.id} request={req} />
                      ))}
                    </div>
                  </section>
                )}
                {rejectedRequests.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Rejected
                    </h2>
                    <div className="space-y-4">
                      {rejectedRequests.map((req) => (
                        <RequestCard key={req.id} request={req} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}

function TripCard({
  trip,
  onDelete,
}: {
  trip: SavedTrip;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">
              {trip.flightOrigin} → {trip.flightDestination}
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Booked {formatDate(trip.confirmedAt)} · Total{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(trip.totalPrice, trip.currency)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="success" className="text-xs">Confirmed</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(trip.id)}
              aria-label="Delete trip"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <Plane className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {trip.flightLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={trip.flightLogoUrl}
                  alt={trip.flightAirline}
                  className="h-5 w-5 rounded"
                />
              )}
              <span className="font-medium">
                {trip.flightAirline} · {trip.flightNumber}
              </span>
              <Badge variant="outline" className="capitalize text-xs">
                {trip.cabinClass.replace("_", " ")}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {formatDateTime(trip.flightDeparture)} → {formatDateTime(trip.flightArrival)}
            </div>
            <div className="font-medium">{formatMoney(trip.flightPrice, trip.flightCurrency)}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">{trip.hotelName}</span>
              {trip.hotelRating > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {trip.hotelRating} ★
                </Badge>
              )}
            </div>
            {trip.hotelAddress && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {trip.hotelAddress}
              </div>
            )}
            <div className="text-muted-foreground">
              {formatDate(trip.hotelCheckIn)} → {formatDate(trip.hotelCheckOut)}
            </div>
            <div className="font-medium">
              {formatMoney(trip.hotelTotalPrice, trip.hotelCurrency)}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Car className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-0.5">
            <span className="font-medium">
              {trip.carProvider} · {trip.carCategory}
            </span>
            {trip.carExample && (
              <div className="text-muted-foreground">{trip.carExample}</div>
            )}
            <div className="text-muted-foreground">
              {formatDateTime(trip.pickupAt)} → {formatDateTime(trip.dropoffAt)}
            </div>
            <div className="font-medium">
              {formatMoney(trip.carTotalPrice)} ({trip.carTotalDays} days ·{" "}
              {formatMoney(trip.carDailyRate)}/day)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestCard({ request }: { request: TravelRequest }) {
  function formatDate(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                Request #{request.request_number}
              </CardTitle>
              {request.status === "accepted" ? (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                  Confirmed
                </span>
              ) : request.status === "rejected" ? (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-400">
                  Rejected
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-400">
                  Pending
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm font-medium">{request.guest_name}</p>
            <p className="text-xs text-muted-foreground">
              Submitted {formatDate(request.created_at.slice(0, 10))}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Passengers</div>
          <div className="flex flex-wrap gap-2">
            {request.passenger_names.map((name, i) => (
              <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Itinerary</div>
          <ol className="space-y-1.5">
            {request.legs.map((leg, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground w-12 shrink-0">Trip {i + 1}</span>
                <span className="font-medium">{leg.from}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-medium">{leg.to}</span>
                <span className="ml-auto text-muted-foreground text-xs">{formatDate(leg.date)}</span>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

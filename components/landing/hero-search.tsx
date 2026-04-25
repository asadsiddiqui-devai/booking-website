"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Building2, Car, ArrowRight, ArrowLeftRight } from "lucide-react";
import { PlaceAutocomplete } from "@/components/search/place-autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TABS = [
  { id: "flights", label: "Flights", icon: Plane },
  { id: "hotels", label: "Hotels", icon: Building2 },
  { id: "cars", label: "Cars", icon: Car },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ── Flight panel ─────────────────────────────── */
function FlightPanel() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [originLabel, setOriginLabel] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [departureDate, setDepartureDate] = useState(offsetDate(14));
  const [returnDate, setReturnDate] = useState(offsetDate(21));
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState("economy");

  function swap() {
    const tmpO = origin, tmpOL = originLabel;
    setOrigin(destination); setOriginLabel(destinationLabel);
    setDestination(tmpO); setDestinationLabel(tmpOL);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) return;
    const q = new URLSearchParams({ origin, destination, departureDate, returnDate, passengers: String(passengers), cabinClass });
    router.push(`/search/flights?${q.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Origin / Destination row */}
      <div className="relative grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</Label>
          <PlaceAutocomplete
            value={originLabel}
            onSelect={(iata, label) => { setOrigin(iata); setOriginLabel(label ?? iata); }}
            placeholder="City or airport"
          />
        </div>

        {/* Swap button */}
        <button
          type="button"
          onClick={swap}
          aria-label="Swap origin and destination"
          className={[
            "absolute left-1/2 top-[calc(50%+10px)] -translate-x-1/2 -translate-y-1/2",
            "z-10 hidden md:flex h-8 w-8 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground shadow-md cursor-pointer",
            "transition-all duration-300 hover:scale-110 hover:rotate-180 hover:shadow-glow",
          ].join(" ")}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</Label>
          <PlaceAutocomplete
            value={destinationLabel}
            onSelect={(iata, label) => { setDestination(iata); setDestinationLabel(label ?? iata); }}
            placeholder="City or airport"
          />
        </div>
      </div>

      {/* Date / Passengers / Cabin row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Depart</Label>
          <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return</Label>
          <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Passengers</Label>
          <Select value={String(passengers)} onChange={(e) => setPassengers(Number(e.target.value))}>
            {[1,2,3,4,5,6].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "passenger" : "passengers"}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cabin</Label>
          <Select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)}>
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Econ.</option>
            <option value="business">Business</option>
            <option value="first">First Class</option>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          size="lg"
          disabled={!origin || !destination}
          className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-glow cursor-pointer"
        >
          <Plane className="h-4 w-4" />
          Search flights
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

/* ── Hotel panel ──────────────────────────────── */
function HotelPanel() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [cityLabel, setCityLabel] = useState("");
  const [checkIn, setCheckIn] = useState(offsetDate(14));
  const [checkOut, setCheckOut] = useState(offsetDate(17));
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city) return;
    const q = new URLSearchParams({ destination: city, checkIn, checkOut, guests: String(guests), rooms: String(rooms) });
    router.push(`/search/hotels?${q.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destination</Label>
        <PlaceAutocomplete
          value={cityLabel}
          onSelect={(iata, label) => { setCity(iata); setCityLabel(label ?? iata); }}
          placeholder="City or hotel"
        />
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-in</Label>
          <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-out</Label>
          <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guests</Label>
          <Select value={String(guests)} onChange={(e) => setGuests(Number(e.target.value))}>
            {[1,2,3,4,5,6].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rooms</Label>
          <Select value={String(rooms)} onChange={(e) => setRooms(Number(e.target.value))}>
            {[1,2,3,4].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "room" : "rooms"}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          size="lg"
          disabled={!city}
          className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-glow cursor-pointer"
        >
          <Building2 className="h-4 w-4" />
          Search hotels
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

/* ── Car panel ────────────────────────────────── */
function CarPanel() {
  const router = useRouter();
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupLabel, setPickupLabel] = useState("");
  const [pickupDate, setPickupDate] = useState(offsetDate(14));
  const [dropoffDate, setDropoffDate] = useState(offsetDate(17));
  const [carType, setCarType] = useState("economy");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickupLocation) return;
    const q = new URLSearchParams({ location: pickupLocation, pickupDate, dropoffDate, carType });
    router.push(`/search/cars?${q.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pick-up location</Label>
        <PlaceAutocomplete
          value={pickupLabel}
          onSelect={(iata, label) => { setPickupLocation(iata); setPickupLabel(label ?? iata); }}
          placeholder="Airport, city or address"
        />
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pick-up date</Label>
          <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Drop-off date</Label>
          <Input type="date" value={dropoffDate} onChange={(e) => setDropoffDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Car type</Label>
          <Select value={carType} onChange={(e) => setCarType(e.target.value)}>
            <option value="economy">Economy</option>
            <option value="compact">Compact</option>
            <option value="midsize">Midsize</option>
            <option value="suv">SUV</option>
            <option value="luxury">Luxury</option>
            <option value="van">Van</option>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          size="lg"
          disabled={!pickupLocation}
          className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-glow cursor-pointer"
        >
          <Car className="h-4 w-4" />
          Search cars
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

/* ── Main HeroSearch ──────────────────────────── */
export function HeroSearch() {
  const [activeTab, setActiveTab] = useState<TabId>("flights");

  const panels: Record<TabId, React.ReactNode> = {
    flights: <FlightPanel />,
    hotels: <HotelPanel />,
    cars: <CarPanel />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {/* Tab bar */}
      <div className="flex justify-center mb-3">
        <div className="inline-flex items-center gap-1 glass rounded-2xl p-1.5 shadow-md">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold",
                  "transition-all duration-300 cursor-pointer",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {active && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-xl bg-primary shadow-md"
                    style={{ boxShadow: "0 4px 16px -2px oklch(0.52 0.17 232 / 0.4)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <tab.icon className="relative h-4 w-4" />
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel container */}
      <div className="glass-strong rounded-3xl shadow-xl p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {panels[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

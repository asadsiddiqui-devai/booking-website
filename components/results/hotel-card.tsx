"use client";

import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";
import type { HotelOfferDTO } from "@/lib/duffel/types";

export function HotelCard({
  hotel,
  flightOfferId,
  cabinClass,
  checkIn,
  checkOut,
  onHover,
}: {
  hotel: HotelOfferDTO;
  flightOfferId?: string;
  cabinClass?: string;
  checkIn: string;
  checkOut: string;
  onHover: (id: string | null) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => onHover(hotel.id)}
      onMouseLeave={() => onHover(null)}
      className="rounded-lg border bg-card shadow-sm transition hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row">
        {hotel.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hotel.photos[0]}
            alt={hotel.name}
            className="h-44 w-full overflow-hidden rounded-l-lg object-cover sm:h-auto sm:w-56"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-l-lg bg-muted sm:h-auto sm:w-56">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold leading-tight">{hotel.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{hotel.address}</p>
            </div>
            {hotel.rating ? (
              <Badge variant="secondary" className="gap-1">
                <Star className="h-3 w-3 fill-current" /> {hotel.rating}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1 text-xs">
            {hotel.distanceToCenterKm !== undefined && (
              <Badge variant="outline">{hotel.distanceToCenterKm} km to center</Badge>
            )}
            {hotel.amenities.slice(0, 3).map((a) => (
              <Badge key={a} variant="outline" className="capitalize">
                {a.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>

          <div className="mt-auto flex items-end justify-between">
            <div>
              <div className="text-lg font-bold">
                {formatMoney(hotel.totalPrice, hotel.currency)}
              </div>
              <div className="text-xs text-muted-foreground">
                {hotel.nights} night{hotel.nights > 1 ? "s" : ""} · {formatMoney(hotel.pricePerNight, hotel.currency)} / night
              </div>
            </div>
            {flightOfferId ? (
              <Link
                href={`/search/cars?flightOfferId=${flightOfferId}&cabinClass=${cabinClass ?? "economy"}&hotelId=${hotel.id}&hotelName=${encodeURIComponent(hotel.name)}&hotelAddress=${encodeURIComponent(hotel.address)}&hotelLat=${hotel.lat ?? ""}&hotelLng=${hotel.lng ?? ""}&hotelCheckIn=${checkIn}&hotelCheckOut=${checkOut}&hotelRating=${hotel.rating ?? 0}&hotelDistanceKm=${hotel.distanceToCenterKm ?? 0}&hotelAmenities=${encodeURIComponent(JSON.stringify(hotel.amenities))}&hotelTotalPrice=${hotel.totalPrice}&hotelCurrency=${hotel.currency}&pickupLocation=${encodeURIComponent(hotel.address)}&pickupAt=${checkIn}T12:00&dropoffAt=${checkOut}T12:00`}
              >
                <Button size="sm">Select hotel</Button>
              </Link>
            ) : (
              <Button size="sm" disabled>Start from a flight</Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

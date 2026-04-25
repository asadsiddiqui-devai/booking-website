"use client";

import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { bookHotelAction } from "@/app/actions/trip-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";
import type { HotelOfferDTO } from "@/lib/duffel/types";

export function HotelCard({
  hotel,
  tripId,
  checkIn,
  checkOut,
  onHover,
}: {
  hotel: HotelOfferDTO;
  tripId?: string;
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
      className="overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row">
        {hotel.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hotel.photos[0]}
            alt={hotel.name}
            className="h-44 w-full object-cover sm:h-auto sm:w-56"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-muted sm:h-auto sm:w-56">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
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
            {tripId ? (
              <form action={bookHotelAction}>
                <input type="hidden" name="tripId" value={tripId} />
                <input type="hidden" name="hotelId" value={hotel.id} />
                <input type="hidden" name="name" value={hotel.name} />
                <input type="hidden" name="address" value={hotel.address} />
                <input type="hidden" name="lat" value={hotel.lat} />
                <input type="hidden" name="lng" value={hotel.lng} />
                <input type="hidden" name="checkIn" value={checkIn} />
                <input type="hidden" name="checkOut" value={checkOut} />
                <input type="hidden" name="rating" value={hotel.rating ?? 0} />
                <input type="hidden" name="distanceKm" value={hotel.distanceToCenterKm ?? 0} />
                <input type="hidden" name="amenities" value={JSON.stringify(hotel.amenities)} />
                <input type="hidden" name="totalPrice" value={hotel.totalPrice} />
                <input type="hidden" name="currency" value={hotel.currency} />
                <Button type="submit" size="sm">Add to trip</Button>
              </form>
            ) : (
              <Button size="sm" disabled>Start from a flight</Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { duffelPost } from "./client";
import type { HotelOfferDTO, HotelSearchParams } from "./types";
import { haversineKm } from "@/lib/geo/haversine";

interface DuffelStayAccommodation {
  id: string;
  name: string;
  rating?: number;
  review_score?: number;
  address?: {
    line_one?: string;
    city_name?: string;
    country_code?: string;
  };
  location?: {
    geographic_coordinates?: { latitude: number; longitude: number };
  };
  photos?: { url: string }[];
  amenities?: { type: string }[];
  cheapest_rate_total_amount?: string;
  cheapest_rate_currency?: string;
  rooms?: {
    rates?: {
      id: string;
      total_amount: string;
      total_currency: string;
      board_type?: string;
    }[];
    name?: string;
  }[];
}

interface DuffelStaysSearchResponse {
  data: {
    results: {
      accommodation: DuffelStayAccommodation;
      cheapest_rate_total_amount?: string;
      cheapest_rate_currency?: string;
    }[];
  };
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

export async function searchStays(
  params: HotelSearchParams,
  centerLat?: number,
  centerLng?: number,
): Promise<HotelOfferDTO[]> {
  const body = {
    location: {
      radius: params.radiusKm ?? 10,
      geographic_coordinates: {
        latitude: params.latitude,
        longitude: params.longitude,
      },
    },
    check_in_date: params.checkIn,
    check_out_date: params.checkOut,
    guests: Array.from({ length: params.guests }, () => ({ type: "adult" })),
    rooms: params.rooms,
  };

  const res = await duffelPost<DuffelStaysSearchResponse>(
    "/stays/search",
    body,
  );

  const nights = nightsBetween(params.checkIn, params.checkOut);
  const lat0 = centerLat ?? params.latitude;
  const lng0 = centerLng ?? params.longitude;

  return (res.data.results ?? []).map((r) => {
    const a = r.accommodation;
    const coords = a.location?.geographic_coordinates;
    const total = Number(r.cheapest_rate_total_amount ?? a.cheapest_rate_total_amount ?? 0);
    const currency = r.cheapest_rate_currency ?? a.cheapest_rate_currency ?? "USD";
    const cheapestRate = a.rooms?.[0]?.rates?.[0];

    return {
      id: a.id,
      rateId: cheapestRate?.id,
      name: a.name,
      rating: a.rating,
      reviewScore: a.review_score,
      address: [a.address?.line_one, a.address?.city_name, a.address?.country_code]
        .filter(Boolean)
        .join(", "),
      lat: coords?.latitude ?? 0,
      lng: coords?.longitude ?? 0,
      distanceToCenterKm:
        coords
          ? Number(haversineKm(lat0, lng0, coords.latitude, coords.longitude).toFixed(2))
          : undefined,
      photos: (a.photos ?? []).map((p) => p.url),
      amenities: (a.amenities ?? []).map((am) => am.type),
      roomType: a.rooms?.[0]?.name,
      boardType: cheapestRate?.board_type,
      pricePerNight: nights > 0 ? Number((total / nights).toFixed(2)) : total,
      totalPrice: total,
      currency,
      nights,
    };
  });
}

export async function getStayQuote(
  rateId: string,
): Promise<{ quoteId: string; totalAmount: number; currency: string }> {
  const res = await duffelPost<{
    data: { id: string; total_amount: string; total_currency: string };
  }>("/stays/quotes", { rate_id: rateId });
  return {
    quoteId: res.data.id,
    totalAmount: Number(res.data.total_amount),
    currency: res.data.total_currency,
  };
}

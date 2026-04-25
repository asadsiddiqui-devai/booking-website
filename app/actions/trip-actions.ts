"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDemoContext } from "@/lib/demo-user";
import { getFlightOffer } from "@/lib/duffel/flights";
import { getCarById } from "@/lib/cars/search";
import { calculatePrice } from "@/lib/cars/pricing";
import { CAR_CATEGORIES, CAR_PROVIDERS } from "@/lib/cars/catalog";

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

function nightsBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

export async function bookFlightAction(formData: FormData) {
  const offerId = String(formData.get("offerId"));
  const cabinClass = String(formData.get("cabinClass") ?? "economy") as
    | "economy"
    | "premium_economy"
    | "business"
    | "first";

  const { supabase, user } = await getDemoContext();
  const offer = await getFlightOffer(offerId, cabinClass);

  const firstSlice = offer.slices[0];
  const firstSeg = firstSlice.segments[0];
  const lastSeg = firstSlice.segments[firstSlice.segments.length - 1];
  const returnSlice = offer.slices[1];

  // Create a draft trip scoped to this flight.
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      name: `${firstSlice.originCity ?? firstSlice.origin} → ${firstSlice.destinationCity ?? firstSlice.destination}`,
      origin_city: firstSlice.originCity ?? firstSlice.origin,
      origin_iata: firstSlice.origin,
      destination_city: firstSlice.destinationCity ?? firstSlice.destination,
      destination_iata: firstSlice.destination,
      start_date: firstSeg.departureAt.slice(0, 10),
      end_date: (returnSlice
        ? returnSlice.segments[returnSlice.segments.length - 1].arrivalAt
        : lastSeg.arrivalAt
      ).slice(0, 10),
      passenger_count: offer.passengerCount,
      status: "draft",
      total_price: offer.totalAmount,
      currency: offer.currency,
    })
    .select("id")
    .single();

  if (tripError || !trip) {
    throw new Error(tripError?.message ?? "Failed to create trip");
  }

  const { error: flightError } = await supabase.from("flight_bookings").insert({
    trip_id: trip.id,
    user_id: user.id,
    duffel_offer_id: offer.id,
    origin_iata: firstSlice.origin,
    destination_iata: firstSlice.destination,
    departure_at: firstSeg.departureAt,
    arrival_at: lastSeg.arrivalAt,
    airline_iata: offer.airlineIata,
    airline_name: offer.airlineName,
    flight_number: firstSeg.flightNumber,
    cabin_class: cabinClass,
    stops: firstSlice.stops,
    duration_minutes: firstSlice.durationMinutes,
    passengers: { count: offer.passengerCount },
    price: offer.totalAmount,
    currency: offer.currency,
    status: "pending",
  });

  if (flightError) throw new Error(flightError.message);

  revalidatePath("/trips");
  redirect(`/search/hotels?tripId=${trip.id}`);
}

export async function bookHotelAction(formData: FormData) {
  const tripId = String(formData.get("tripId"));
  const hotelId = String(formData.get("hotelId"));
  const name = String(formData.get("name"));
  const address = String(formData.get("address") ?? "");
  const lat = Number(formData.get("lat") ?? 0);
  const lng = Number(formData.get("lng") ?? 0);
  const checkIn = String(formData.get("checkIn"));
  const checkOut = String(formData.get("checkOut"));
  const rating = Number(formData.get("rating") ?? 0) || null;
  const amenitiesRaw = String(formData.get("amenities") ?? "[]");
  const distanceKm = Number(formData.get("distanceKm") ?? 0) || null;
  const totalPrice = Number(formData.get("totalPrice") ?? 0);
  const currency = String(formData.get("currency") ?? "USD");

  const { supabase, user } = await getDemoContext();

  const { data: trip } = await supabase
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!trip) throw new Error("Trip not found");

  const nights = nightsBetween(checkIn, checkOut);

  const { error } = await supabase.from("hotel_bookings").insert({
    trip_id: tripId,
    user_id: user.id,
    duffel_stay_id: hotelId,
    duffel_quote_id: null,
    hotel_name: name,
    hotel_rating: rating,
    address,
    lat,
    lng,
    distance_to_center_km: distanceKm,
    check_in: checkIn,
    check_out: checkOut,
    nights,
    amenities: JSON.parse(amenitiesRaw),
    price_per_night: nights > 0 ? Number((totalPrice / nights).toFixed(2)) : totalPrice,
    total_price: totalPrice,
    currency,
    status: "pending",
  });

  if (error) throw new Error(error.message);

  const { data: tripRow } = await supabase
    .from("trips")
    .select("total_price")
    .eq("id", tripId)
    .single();
  const newTotal = Number(tripRow?.total_price ?? 0) + totalPrice;
  await supabase.from("trips").update({ total_price: newTotal }).eq("id", tripId);

  revalidatePath(`/trips/${tripId}`);
  redirect(`/search/cars?tripId=${tripId}`);
}

export async function bookCarAction(formData: FormData) {
  const tripId = String(formData.get("tripId"));
  const vehicleId = String(formData.get("vehicleId"));
  const pickupLocation = String(formData.get("pickupLocation"));
  const pickupAt = String(formData.get("pickupAt"));
  const dropoffLocation = String(formData.get("dropoffLocation"));
  const dropoffAt = String(formData.get("dropoffAt"));

  const { supabase, user } = await getDemoContext();

  const { data: trip } = await supabase
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!trip) throw new Error("Trip not found");

  const base = getCarById(vehicleId);
  if (!base) throw new Error("Invalid vehicle");

  const days = daysBetween(pickupAt, dropoffAt);
  const category = CAR_CATEGORIES.find((c) => c.id === base.categoryId)!;
  const provider = CAR_PROVIDERS.find((p) => p.id === base.providerId)!;
  const price = calculatePrice({
    category,
    provider,
    location: pickupLocation,
    days,
    pickupIso: pickupAt.slice(0, 10),
  });

  const { error } = await supabase.from("car_bookings").insert({
    trip_id: tripId,
    user_id: user.id,
    catalog_vehicle_id: vehicleId,
    provider_name: provider.name,
    provider_logo_url: provider.logoUrl,
    vehicle_category: category.id,
    vehicle_example: category.example,
    transmission: category.transmission,
    air_conditioning: category.airConditioning,
    seats: category.seats,
    doors: category.doors,
    pickup_location: pickupLocation,
    pickup_at: pickupAt,
    dropoff_location: dropoffLocation,
    dropoff_at: dropoffAt,
    daily_rate: price.dailyRate,
    total_days: price.totalDays,
    total_price: price.totalPrice,
    currency: "USD",
    status: "pending",
  });

  if (error) throw new Error(error.message);

  const { data: tripRow } = await supabase
    .from("trips")
    .select("total_price")
    .eq("id", tripId)
    .single();
  const newTotal = (Number(tripRow?.total_price ?? 0) + price.totalPrice);
  await supabase.from("trips").update({ total_price: newTotal }).eq("id", tripId);

  revalidatePath(`/trips/${tripId}`);
  redirect(`/checkout/${tripId}`);
}

export async function cancelTripAction(formData: FormData) {
  const tripId = String(formData.get("tripId"));
  const { supabase, user } = await getDemoContext();

  await supabase
    .from("trips")
    .update({ status: "cancelled" })
    .eq("id", tripId)
    .eq("user_id", user.id);

  await supabase.from("flight_bookings").update({ status: "cancelled" }).eq("trip_id", tripId);
  await supabase.from("hotel_bookings").update({ status: "cancelled" }).eq("trip_id", tripId);
  await supabase.from("car_bookings").update({ status: "cancelled" }).eq("trip_id", tripId);

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
}

export async function completeCheckoutAction(formData: FormData) {
  const tripId = String(formData.get("tripId"));
  const cardholderName = String(formData.get("cardholderName"));
  const cardLast4 = String(formData.get("cardNumber")).replace(/\D/g, "").slice(-4);
  const cardBrand = String(formData.get("cardBrand") ?? "card");
  const billingAddressRaw = String(formData.get("billingAddress") ?? "{}");

  const { supabase, user } = await getDemoContext();

  const { data: trip } = await supabase
    .from("trips")
    .select("id, total_price, currency")
    .eq("id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!trip) throw new Error("Trip not found");

  await supabase.from("payments").insert({
    trip_id: trip.id,
    user_id: user.id,
    amount: trip.total_price ?? 0,
    currency: trip.currency,
    card_last4: cardLast4,
    card_brand: cardBrand,
    cardholder_name: cardholderName,
    billing_address: JSON.parse(billingAddressRaw),
    status: "simulated_success",
    simulated: true,
  });

  await supabase.from("trips").update({ status: "booked" }).eq("id", trip.id);
  await supabase.from("flight_bookings").update({ status: "confirmed" }).eq("trip_id", trip.id);
  await supabase.from("hotel_bookings").update({ status: "confirmed" }).eq("trip_id", trip.id);
  await supabase.from("car_bookings").update({ status: "confirmed" }).eq("trip_id", trip.id);

  revalidatePath(`/trips/${trip.id}`);
  redirect(`/trips/${trip.id}?confirmed=1`);
}

// Fire-and-forget: search hotels near a city and return results for the UI
export async function hotelSearchAction(
  city: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  rooms: number,
) {
  const { geocode } = await import("@/lib/geo/nominatim");
  const { searchHotels } = await import("@/lib/booking/hotels");
  const geo = await geocode(city);
  if (!geo) return { results: [], center: null as { lat: number; lng: number; name: string } | null, error: "Could not resolve city" };
  try {
    const results = await searchHotels(city, checkIn, checkOut, guests, rooms, geo.lat, geo.lng);
    return {
      results,
      center: { lat: geo.lat, lng: geo.lng, name: geo.displayName },
      error: null as string | null,
    };
  } catch (err) {
    return { results: [], center: { lat: geo.lat, lng: geo.lng, name: geo.displayName }, error: (err as Error).message };
  }
}

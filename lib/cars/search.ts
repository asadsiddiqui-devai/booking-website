import {
  CAR_CATEGORIES,
  CAR_PROVIDERS,
  type CarCategory,
} from "./catalog";
import { calculatePrice, isAvailable } from "./pricing";

export interface CarSearchParams {
  location: string;
  pickupAt: string; // ISO
  dropoffAt: string; // ISO
  category?: CarCategory;
  transmission?: "automatic" | "manual";
  maxPrice?: number;
}

export interface CarResult {
  id: string; // deterministic: provider:category:location:pickup
  providerId: string;
  providerName: string;
  providerLogoUrl: string;
  categoryId: CarCategory;
  categoryLabel: string;
  example: string;
  seats: number;
  doors: number;
  transmission: "automatic" | "manual";
  airConditioning: boolean;
  dailyRate: number;
  totalDays: number;
  totalPrice: number;
  currency: "USD";
}

function daysBetween(iso1: string, iso2: string): number {
  const ms = new Date(iso2).getTime() - new Date(iso1).getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function searchCars(params: CarSearchParams): CarResult[] {
  const days = daysBetween(params.pickupAt, params.dropoffAt);
  const pickupDay = params.pickupAt.slice(0, 10); // stable per-day seed

  const results: CarResult[] = [];

  for (const provider of CAR_PROVIDERS) {
    for (const category of CAR_CATEGORIES) {
      if (params.category && category.id !== params.category) continue;
      if (
        params.transmission &&
        category.transmission !== params.transmission
      )
        continue;

      if (
        !isAvailable({
          providerId: provider.id,
          categoryId: category.id,
          location: params.location,
          pickupIso: pickupDay,
        })
      ) {
        continue;
      }

      const price = calculatePrice({
        category,
        provider,
        location: params.location,
        days,
        pickupIso: pickupDay,
      });

      if (params.maxPrice && price.totalPrice > params.maxPrice) continue;

      results.push({
        id: `${provider.id}:${category.id}:${encodeURIComponent(params.location)}:${pickupDay}`,
        providerId: provider.id,
        providerName: provider.name,
        providerLogoUrl: provider.logoUrl,
        categoryId: category.id,
        categoryLabel: category.label,
        example: category.example,
        seats: category.seats,
        doors: category.doors,
        transmission: category.transmission,
        airConditioning: category.airConditioning,
        dailyRate: price.dailyRate,
        totalDays: price.totalDays,
        totalPrice: price.totalPrice,
        currency: "USD",
      });
    }
  }

  return results.sort((a, b) => a.totalPrice - b.totalPrice);
}

export function getCarById(id: string): CarResult | null {
  const [providerId, categoryId, locationEncoded, pickupDay] = id.split(":");
  if (!providerId || !categoryId || !locationEncoded || !pickupDay) return null;
  const location = decodeURIComponent(locationEncoded);
  const provider = CAR_PROVIDERS.find((p) => p.id === providerId);
  const category = CAR_CATEGORIES.find((c) => c.id === categoryId);
  if (!provider || !category) return null;

  // Default to 1 day for lookup; caller re-applies real duration at booking.
  const price = calculatePrice({
    category,
    provider,
    location,
    days: 1,
    pickupIso: pickupDay,
  });

  return {
    id,
    providerId: provider.id,
    providerName: provider.name,
    providerLogoUrl: provider.logoUrl,
    categoryId: category.id,
    categoryLabel: category.label,
    example: category.example,
    seats: category.seats,
    doors: category.doors,
    transmission: category.transmission,
    airConditioning: category.airConditioning,
    dailyRate: price.dailyRate,
    totalDays: 1,
    totalPrice: price.totalPrice,
    currency: "USD",
  };
}

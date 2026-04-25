import {
  CAR_CATEGORIES,
  type CarCategorySpec,
  type CarProvider,
  cityMultiplier,
  durationDiscount,
} from "./catalog";

// Simple deterministic 32-bit hash. Same inputs → same output, across sessions.
export function hashKey(key: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededFloat(key: string): number {
  return hashKey(key) / 0xffffffff;
}

export interface PriceBreakdown {
  dailyRate: number;
  totalDays: number;
  totalPrice: number;
}

export function calculatePrice(args: {
  category: CarCategorySpec;
  provider: CarProvider;
  location: string;
  days: number;
  pickupIso: string;
}): PriceBreakdown {
  const city = cityMultiplier(args.location);
  const duration = durationDiscount(args.days);
  const jitterSeed = seededFloat(
    `${args.provider.id}|${args.category.id}|${args.location}|${args.pickupIso}`,
  );
  // Jitter range: 0.95 – 1.05
  const jitter = 0.95 + jitterSeed * 0.1;

  const daily =
    args.category.baseDailyRate *
    args.provider.multiplier *
    city *
    duration *
    jitter;

  const dailyRate = Math.round(daily * 100) / 100;
  const totalPrice = Math.round(dailyRate * args.days * 100) / 100;

  return { dailyRate, totalDays: args.days, totalPrice };
}

// Availability gate: ~80% of combos are available, deterministic per query.
export function isAvailable(args: {
  providerId: string;
  categoryId: string;
  location: string;
  pickupIso: string;
}): boolean {
  const s = seededFloat(
    `avail|${args.providerId}|${args.categoryId}|${args.location}|${args.pickupIso}`,
  );
  return s < 0.8;
}

export function getCategory(id: string): CarCategorySpec | undefined {
  return CAR_CATEGORIES.find((c) => c.id === id);
}

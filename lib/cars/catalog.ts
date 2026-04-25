export type CarCategory =
  | "economy"
  | "compact"
  | "midsize"
  | "fullsize"
  | "suv"
  | "luxury"
  | "van"
  | "convertible";

export interface CarProvider {
  id: string;
  name: string;
  logoUrl: string;
  multiplier: number;
}

export interface CarCategorySpec {
  id: CarCategory;
  label: string;
  example: string;
  seats: number;
  doors: number;
  transmission: "automatic" | "manual";
  airConditioning: boolean;
  baseDailyRate: number;
}

// Real providers with public-domain / Wikimedia logo URLs (brand-accurate).
export const CAR_PROVIDERS: CarProvider[] = [
  {
    id: "hertz",
    name: "Hertz",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Hertz_logo.svg/320px-Hertz_logo.svg.png",
    multiplier: 1.1,
  },
  {
    id: "avis",
    name: "Avis",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Avis_logo_2012.svg/320px-Avis_logo_2012.svg.png",
    multiplier: 1.08,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Enterprise_Rent-A-Car_logo.svg/320px-Enterprise_Rent-A-Car_logo.svg.png",
    multiplier: 1.05,
  },
  {
    id: "europcar",
    name: "Europcar",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Europcar_logo.svg/320px-Europcar_logo.svg.png",
    multiplier: 1.0,
  },
  {
    id: "sixt",
    name: "Sixt",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Sixt-Logo.svg/320px-Sixt-Logo.svg.png",
    multiplier: 1.15,
  },
  {
    id: "budget",
    name: "Budget",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Budget_Car_Rental_logo.svg/320px-Budget_Car_Rental_logo.svg.png",
    multiplier: 0.92,
  },
  {
    id: "alamo",
    name: "Alamo",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Alamo_Rent_a_Car_logo.svg/320px-Alamo_Rent_a_Car_logo.svg.png",
    multiplier: 0.98,
  },
  {
    id: "thrifty",
    name: "Thrifty",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Thrifty_Car_Rental_logo.svg/320px-Thrifty_Car_Rental_logo.svg.png",
    multiplier: 0.95,
  },
];

export const CAR_CATEGORIES: CarCategorySpec[] = [
  { id: "economy", label: "Economy", example: "Nissan Versa or similar", seats: 5, doors: 4, transmission: "automatic", airConditioning: true, baseDailyRate: 35 },
  { id: "compact", label: "Compact", example: "Toyota Corolla or similar", seats: 5, doors: 4, transmission: "automatic", airConditioning: true, baseDailyRate: 42 },
  { id: "midsize", label: "Midsize", example: "Volkswagen Jetta or similar", seats: 5, doors: 4, transmission: "automatic", airConditioning: true, baseDailyRate: 55 },
  { id: "fullsize", label: "Fullsize", example: "Chevrolet Malibu or similar", seats: 5, doors: 4, transmission: "automatic", airConditioning: true, baseDailyRate: 68 },
  { id: "suv", label: "SUV", example: "Ford Escape or similar", seats: 5, doors: 4, transmission: "automatic", airConditioning: true, baseDailyRate: 85 },
  { id: "luxury", label: "Luxury", example: "BMW 5 Series or similar", seats: 5, doors: 4, transmission: "automatic", airConditioning: true, baseDailyRate: 150 },
  { id: "van", label: "Van", example: "Chrysler Pacifica or similar", seats: 7, doors: 4, transmission: "automatic", airConditioning: true, baseDailyRate: 110 },
  { id: "convertible", label: "Convertible", example: "Ford Mustang Convertible or similar", seats: 4, doors: 2, transmission: "automatic", airConditioning: true, baseDailyRate: 120 },
];

// City tiers: premium markets pay more, budget destinations pay less.
const PREMIUM_CITIES = new Set([
  "new york", "nyc", "san francisco", "los angeles", "miami", "london",
  "paris", "zurich", "geneva", "tokyo", "dubai", "monaco", "singapore",
  "sydney", "hong kong",
]);
const BUDGET_CITIES = new Set([
  "bangkok", "lisbon", "prague", "budapest", "warsaw", "krakow",
  "mexico city", "cancun", "bali", "denpasar", "istanbul", "sofia",
]);

export function cityMultiplier(location: string): number {
  const key = location.trim().toLowerCase();
  if (PREMIUM_CITIES.has(key)) return 1.3;
  if (BUDGET_CITIES.has(key)) return 0.8;
  // Partial match on first word (e.g. "London Heathrow" -> "london")
  const first = key.split(/[\s,]+/)[0];
  if (first && PREMIUM_CITIES.has(first)) return 1.3;
  if (first && BUDGET_CITIES.has(first)) return 0.8;
  return 1.0;
}

export function durationDiscount(days: number): number {
  if (days >= 14) return 0.85;
  if (days >= 7) return 0.92;
  return 1.0;
}

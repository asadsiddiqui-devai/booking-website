import { z } from "zod";

export const flightSearchSchema = z.object({
  origin: z.string().length(3, "IATA code must be 3 letters").toUpperCase(),
  destination: z.string().length(3, "IATA code must be 3 letters").toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  passengers: z.coerce.number().int().min(1).max(9),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]),
});

export const hotelSearchSchema = z.object({
  city: z.string().min(2),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.coerce.number().int().min(1).max(10),
  rooms: z.coerce.number().int().min(1).max(5),
});

export const carSearchSchema = z.object({
  location: z.string().min(2),
  pickupAt: z.string(),
  dropoffAt: z.string(),
  category: z
    .enum([
      "economy", "compact", "midsize", "fullsize",
      "suv", "luxury", "van", "convertible",
    ])
    .optional(),
});

// Simulated card form. Luhn is checked client-side before submit.
export const cardFormSchema = z.object({
  cardholderName: z.string().min(2, "Name required"),
  cardNumber: z
    .string()
    .regex(/^[0-9\s]{12,23}$/, "Enter a valid card number")
    .transform((s) => s.replace(/\s+/g, "")),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/YY"),
  cvc: z.string().regex(/^\d{3,4}$/, "3-4 digit CVC"),
  billingAddress: z.object({
    line1: z.string().min(3),
    city: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2),
  }),
});

export type CardFormInput = z.infer<typeof cardFormSchema>;

// Luhn check — call from client before submit.
export function luhnValid(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 12) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function detectCardBrand(cardNumber: string): string {
  const n = cardNumber.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  return "card";
}

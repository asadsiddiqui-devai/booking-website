"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { completeCheckoutAction } from "@/app/actions/trip-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cardFormSchema,
  detectCardBrand,
  luhnValid,
} from "@/lib/zod/schemas";
import { formatMoney } from "@/lib/utils/format";

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function CheckoutForm({
  tripId,
  total,
  currency,
}: {
  tripId: string;
  total: number;
  currency: string;
}) {
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      cardholderName,
      cardNumber,
      expiry,
      cvc,
      billingAddress: { line1, city, postalCode, country },
    };
    const parsed = cardFormSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first.message);
      return;
    }
    if (!luhnValid(cardNumber)) {
      toast.error("Card number failed Luhn check");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.set("tripId", tripId);
    form.set("cardholderName", cardholderName);
    form.set("cardNumber", cardNumber);
    form.set("cardBrand", detectCardBrand(cardNumber));
    form.set(
      "billingAddress",
      JSON.stringify({ line1, city, postalCode, country }),
    );
    try {
      await completeCheckoutAction(form);
    } catch (err) {
      // redirect() throws; ignore NEXT_REDIRECT — anything else is real
      const message = (err as Error).message;
      if (!message.includes("NEXT_REDIRECT")) {
        toast.error(message);
        setSubmitting(false);
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Payment details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cardholderName">Cardholder name</Label>
            <Input
              id="cardholderName"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cardNumber">Card number</Label>
            <Input
              id="cardNumber"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                inputMode="numeric"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                inputMode="numeric"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold">Billing address</h3>
            <div className="mt-2 grid gap-3">
              <Input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address" required />
              <div className="grid grid-cols-2 gap-3">
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" required />
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal code" required />
              </div>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" required />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Processing…" : `Pay ${formatMoney(total, currency)} (simulated)`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            This is a demo. No card is charged and no card data is transmitted off-site.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

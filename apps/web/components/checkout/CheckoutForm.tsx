"use client";

import { FormEvent, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";

type Props = { token: string };

export function CheckoutForm({ token }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cod">("stripe");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setMessage("");

    try {
      const order = await fetchApi<{ id: string }>("/api/orders/", {
        method: "POST",
        token,
        body: JSON.stringify({
          payment_method: paymentMethod,
          shipping_address: {
            full_name: form.get("full_name"),
            phone: form.get("phone"),
            address_line1: form.get("address_line1"),
            city: form.get("city"),
            state: form.get("state"),
            postal_code: form.get("postal_code"),
            country: form.get("country"),
          },
        }),
      });

      if (paymentMethod === "stripe") {
        const payment = await fetchApi<{ client_secret?: string }>("/api/payments/create-intent", {
          method: "POST",
          token,
          body: JSON.stringify({ order_id: order.id }),
        });
        setMessage(
          payment.client_secret
            ? "Payment intent created. Connect Stripe Elements to collect card details."
            : "This order already has a completed payment.",
        );
      } else {
        setMessage("Order placed with cash on delivery.");
      }
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to place order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery and payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="full_name" placeholder="Full name" required />
            <Input name="phone" placeholder="Phone number" required />
          </div>
          <Input name="address_line1" placeholder="Street address" required />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input name="city" placeholder="City" required />
            <Input name="state" placeholder="State / province" required />
            <Input name="postal_code" placeholder="Postal code" required />
          </div>
          <Input name="country" placeholder="Country" defaultValue="US" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
              />
              <span>
                <span className="block text-sm font-medium">Card payment</span>
                <span className="text-xs text-muted-foreground">Stripe payment intent</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              <span>
                <span className="block text-sm font-medium">Cash on delivery</span>
                <span className="text-xs text-muted-foreground">Pay when delivered</span>
              </span>
            </label>
          </div>
          <Button disabled={isSubmitting}>
            {isSubmitting ? "Placing order..." : "Place order"}
          </Button>
          {message && (
            <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm" role="status">
              {message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

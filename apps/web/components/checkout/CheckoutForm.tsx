"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { CreditCard, Truck, Loader2 } from "lucide-react";

type Props = { token: string };

export function CheckoutForm({ token }: Props) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cod">("stripe");
  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setMessage("");

    try {
      // 1. Create order in FastAPI backend
      const order = await fetchApi<{ id: string }>("/api/orders/", {
        method: "POST",
        token,
        body: JSON.stringify({
          payment_method: paymentMethod,
          coupon_code: couponCode.trim() || undefined,
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

      // 2. Handle payment flow
      if (paymentMethod === "stripe") {
        const session = await fetchApi<{ session_id: string; url: string }>(
          "/api/payments/create-checkout-session",
          {
            method: "POST",
            token,
            body: JSON.stringify({ order_id: order.id }),
          }
        );

        if (session.url) {
          window.location.href = session.url;
        } else {
          router.push(`/checkout/success?session_id=${session.session_id}&order_id=${order.id}`);
        }
      } else {
        // Cash on delivery
        router.push(`/checkout/success?order_id=${order.id}`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to place order.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-lg border-muted">
      <CardHeader>
        <CardTitle className="text-xl">Shipping & Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={submit}>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              1. Delivery Address
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="full_name" placeholder="Full name *" required />
              <Input name="phone" placeholder="Phone number *" required />
            </div>
            <Input name="address_line1" placeholder="Street address *" required />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input name="city" placeholder="City *" required />
              <Input name="state" placeholder="State / Province *" required />
              <Input name="postal_code" placeholder="Postal code *" required />
            </div>
            <Input name="country" placeholder="Country *" defaultValue="US" required />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              2. Optional Coupon
            </h4>
            <Input
              name="coupon_code"
              placeholder="Discount code (e.g. SAVE10)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              3. Payment Method
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  paymentMethod === "stripe"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  className="mt-1"
                  checked={paymentMethod === "stripe"}
                  onChange={() => setPaymentMethod("stripe")}
                />
                <div>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Stripe Secure Payment
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    Credit / Debit card (Instant checkout & database sync)
                  </span>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  paymentMethod === "cod"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  className="mt-1"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <div>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Truck className="w-4 h-4 text-primary" />
                    Cash on Delivery
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    Pay securely in cash when parcel is delivered
                  </span>
                </div>
              </label>
            </div>
          </div>

          {message && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {message}
            </div>
          )}

          <Button disabled={isSubmitting} size="lg" className="w-full mt-2">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing order...
              </span>
            ) : paymentMethod === "stripe" ? (
              "Proceed to Stripe Checkout"
            ) : (
              "Place Cash on Delivery Order"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

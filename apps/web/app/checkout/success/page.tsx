import Link from "next/link";
import { auth } from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import type { Order } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { CheckCircle2, ArrowRight, Package, MapPin, CreditCard } from "lucide-react";

interface Props {
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id, order_id } = await searchParams;
  const session = await auth();
  const token = session?.accessToken;

  let order: Order | null = null;
  let verificationError = "";

  if (session_id) {
    try {
      // Verify Stripe session with backend and sync database
      order = await fetchApi<Order>("/api/payments/verify-checkout-session", {
        method: "POST",
        token,
        body: JSON.stringify({ session_id, order_id }),
      });
    } catch (err) {
      verificationError = err instanceof Error ? err.message : "Verification error";
    }
  }

  // Fallback: fetch order directly if we have order_id and verification didn't provide it
  if (!order && order_id && token) {
    try {
      order = await fetchApi<Order>(`/api/orders/${order_id}`, { token });
    } catch {
      // Order not found
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Order Confirmed!</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Thank you for your purchase. We have received your order and are preparing shipment.
        </p>
      </div>

      {order ? (
        <Card className="shadow-lg border-muted">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Order ID</p>
              <CardTitle className="text-lg font-mono">{order.id}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Badge variant={order.payment_status === "paid" ? "default" : "secondary"} className="capitalize">
                Payment: {order.payment_status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                Status: {order.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Items */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Purchased Items ({order.items?.length ?? 0})
              </h4>
              <div className="divide-y border rounded-lg overflow-hidden">
                {order.items?.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.sku} · Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold">${item.line_total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Shipping Address
                </h4>
                <div className="border rounded-lg p-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state}{" "}
                    {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country} · Tel: {order.shipping_address.phone}</p>
                </div>
              </div>
            )}

            {/* Total breakdown */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{order.shipping_fee === 0 ? "Free" : `$${order.shipping_fee.toFixed(2)}`}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total Paid</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : verificationError ? (
        <Card className="p-6 text-center border-red-500/20 bg-red-500/10">
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            Unable to verify payment: {verificationError}
          </p>
          <p className="text-xs text-muted-foreground">
            Please check your dashboard or contact customer support.
          </p>
        </Card>
      ) : null}

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/dashboard">
          <Button variant="outline" className="w-full sm:w-auto">
            View in Dashboard
          </Button>
        </Link>
        <Link href="/products">
          <Button className="w-full sm:w-auto flex items-center gap-2">
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

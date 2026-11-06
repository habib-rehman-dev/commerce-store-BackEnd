"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Cart, CartItem, Coupon } from "@workspace/types";
import { fetchApi } from "@/lib/api";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

type Props = {
  initialCart: Cart | null;
  token?: string | null;
};

export function CartClient({ initialCart, token }: Props) {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Optimistic list for cart items
  const {
    items,
    error: optimisticError,
    removeOptimistic,
    updateOptimistic,
    clearError,
  } = useOptimisticList<CartItem>(initialCart?.items || []);

  // Calculate pricing
  const subtotal = items.reduce((acc, it) => {
    const price = it.variant?.discount_price ?? it.variant?.price ?? 0;
    return acc + price * it.quantity;
  }, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      discount = Math.min(appliedCoupon.discount_value, subtotal);
    }
  }

  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10;
  const total = Math.max(0, subtotal - discount + shipping);

  async function handleRemoveItem(itemId: string) {
    if (!token) return;
    await removeOptimistic(itemId, async () => {
      await fetchApi(`/api/cart/items/${itemId}`, {
        method: "DELETE",
        token,
      });
      router.refresh();
    });
  }

  async function handleQuantityChange(item: CartItem, delta: number) {
    if (!token) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await handleRemoveItem(item.id);
      return;
    }

    await updateOptimistic(item.id, { quantity: newQty }, async () => {
      await fetchApi(`/api/cart/items/${item.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ quantity: newQty }),
      });
      router.refresh();
    });
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const coupon = await fetchApi<Coupon>(
        `/api/coupons/code/${encodeURIComponent(couponCode.trim().toUpperCase())}`
      );
      if (coupon.min_order_value && subtotal < coupon.min_order_value) {
        setCouponError(`Requires minimum order of $${coupon.min_order_value.toFixed(2)}`);
        return;
      }
      setAppliedCoupon(coupon);
    } catch {
      setCouponError("Invalid or expired coupon code.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="p-16 border rounded-2xl bg-muted/20 text-center flex flex-col items-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Your cart is currently empty</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Explore our catalog and find high-grade tech and apparel.
        </p>
        <Link href="/products">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {optimisticError && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{optimisticError} (action reverted)</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearError} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const unitPrice = item.variant?.discount_price ?? item.variant?.price ?? 0;
            const lineTotal = unitPrice * item.quantity;
            const img = item.product?.images?.[0] || item.variant?.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

            return (
              <Card key={item.id} className="p-4 flex gap-4 items-center transition-all duration-200">
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden shrink-0 border">
                  <img
                    src={img}
                    alt={item.product?.name || "Product"}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{item.product?.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SKU: {item.variant?.sku || "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${unitPrice.toFixed(2)} each
                  </p>
                </div>

                <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted/40">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item, -1)}
                    className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item, 1)}
                    className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition"
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <span className="font-bold text-sm block">
                    ${lineTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/10 transition"
                  title="Remove item (Optimistic)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            );
          })}
        </div>

        <div>
          <Card className="p-6 sticky top-24">
            <h3 className="font-bold text-base mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="flex items-center gap-1">
                    Coupon ({appliedCoupon?.code})
                  </span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "Free ($100+ order)" : `$${shipping.toFixed(2)}`}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon (e.g. SAVE10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="text-xs uppercase"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    onClick={applyCoupon}
                  >
                    {isApplyingCoupon ? "..." : "Apply"}
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 mt-1">{couponError}</p>
                )}
                {appliedCoupon && !couponError && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Coupon {appliedCoupon.code} applied!
                  </p>
                )}
              </div>

              <Link href="/checkout" className="block">
                <Button className="w-full flex items-center justify-center gap-2" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

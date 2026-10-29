import Link from "next/link";
import { auth } from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import type { Cart } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { Input } from "@workspace/ui/components/input";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default async function CartPage() {
  const session = await auth();
  let cart: Cart | null = null;

  if (session?.user?.id) {
    try {
      cart = await fetchApi<Cart>("/api/cart/", {
        token: session.accessToken,
      });
    } catch {
      // Empty or new cart
    }
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((acc, it) => {
    const price = it.variant?.discount_price ?? it.variant?.price ?? 0;
    return acc + price * it.quantity;
  }, 0);
  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10;
  const total = subtotal + shipping;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="p-16 border rounded-2xl bg-muted/20 text-center flex flex-col items-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Your cart is currently empty</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Explore our catalog and find something you love.
          </p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-4 flex gap-4 items-center">
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden shrink-0">
                  <img
                    src={item.product?.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"}
                    alt={item.product?.name || "Product"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.product?.name}</h4>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm">
                    ${((item.variant?.discount_price ?? item.variant?.price ?? 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div>
            <Card className="p-6">
              <h3 className="font-bold text-base mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Coupon code (e.g. SAVE10)" className="text-xs" />
                  <Button variant="outline" size="sm">Apply</Button>
                </div>
                <Link href="/checkout" className="block">
                  <Button className="w-full flex items-center justify-center gap-2">
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

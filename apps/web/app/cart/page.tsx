import { auth } from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import type { Cart } from "@workspace/types";
import { CartClient } from "./CartClient";

export default async function CartPage() {
  const session = await auth();
  let cart: Cart | null = null;

  if (session?.user?.id && session.accessToken) {
    try {
      cart = await fetchApi<Cart>("/api/cart/", {
        token: session.accessToken,
      });
    } catch {
      // Empty or new cart
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your items and proceed to secure checkout
        </p>
      </div>

      <CartClient initialCart={cart} token={session?.accessToken} />
    </div>
  );
}

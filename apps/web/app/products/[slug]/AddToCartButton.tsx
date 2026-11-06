"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant } from "@workspace/types";
import { fetchApi } from "@/lib/api";
import { Button } from "@workspace/ui/components/button";
import { ShoppingBag, Check, Plus, Minus, Loader2 } from "lucide-react";

type Props = {
  product: Product;
  token?: string | null;
};

export function AddToCartButton({ product, token }: Props) {
  const router = useRouter();
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddToCart() {
    if (!token) {
      router.push(`/sign-in?callbackUrl=/products/${product.slug}`);
      return;
    }

    if (!selectedVariant) {
      setError("Please select an edition.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await fetchApi("/api/cart/items", {
        method: "POST",
        token,
        body: JSON.stringify({
          product_id: product.id,
          variant_id: selectedVariant.id,
          quantity,
        }),
      });

      setIsSuccess(true);
      router.refresh();
      setTimeout(() => setIsSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Variants selection */}
      {variants.length > 1 && (
        <div>
          <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
            Select Edition / Variant
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const label =
                Object.entries(v.attributes || {})
                  .map(([_, val]) => val)
                  .join(" - ") || v.sku;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-2 text-xs rounded-lg border font-medium transition ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {label}
                  {v.price && ` ($${(v.discount_price ?? v.price).toFixed(2)})`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Add button */}
      <div className="flex items-center gap-4">
        <div className="flex items-center border rounded-lg bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2 hover:bg-background rounded text-muted-foreground hover:text-foreground transition"
            title="Decrease"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="p-2 hover:bg-background rounded text-muted-foreground hover:text-foreground transition"
            title="Increase"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={isLoading || Boolean(selectedVariant && selectedVariant.stock <= 0)}
          className="flex-1 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding to cart...
            </>
          ) : isSuccess ? (
            <>
              <Check className="w-5 h-5 text-emerald-400" />
              Added to Cart!
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              {selectedVariant && selectedVariant.stock <= 0 ? "Out of Stock" : "Add to Cart"}
            </>
          )}
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

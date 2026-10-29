import { notFound } from "next/navigation";
import { fetchApi } from "@/lib/api";
import type { Product, Review } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { ShoppingBag, Star, ShieldCheck, Truck } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  let product: Product | null = null;
  let reviews: Review[] = [];

  try {
    product = await fetchApi<Product>(`/api/products/slug/${slug}`);
    if (product) {
      reviews = await fetchApi<Review[]>(`/api/reviews/product/${product.id}`).catch(() => []);
    }
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  const primaryVariant = product.variants?.[0];
  const price = primaryVariant?.price ?? 0;
  const discountPrice = primaryVariant?.discount_price;
  const imageUrl = product.images?.[0] || primaryVariant?.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={img} alt={`${product?.name} thumbnail ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="flex flex-col">
          <Badge variant="outline" className="w-fit mb-3">
            In Stock ({primaryVariant?.stock ?? 0} units)
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{product.name}</h1>
          <p className="text-xs text-muted-foreground mt-1">SKU: {primaryVariant?.sku}</p>

          <div className="mt-4 flex items-baseline gap-3">
            {discountPrice ? (
              <>
                <span className="text-3xl font-extrabold text-foreground">${discountPrice.toFixed(2)}</span>
                <span className="text-lg text-muted-foreground line-through">${price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-foreground">${price.toFixed(2)}</span>
            )}
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="font-semibold text-sm mb-2">Description</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
          </div>

          {/* Variants */}
          {product.variants?.length > 1 && (
            <div className="mt-6">
              <h3 className="font-semibold text-sm mb-3">Available Editions</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <Button key={v.id} variant="outline" size="sm" className="text-xs">
                    {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(" / ") || v.sku}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <Button size="lg" className="w-full flex items-center justify-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Add to Cart
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t pt-6">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <span>Fast Worldwide Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>2 Year Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="mt-16 border-t pt-10">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customer reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  {r.title && <span className="font-semibold text-sm">{r.title}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

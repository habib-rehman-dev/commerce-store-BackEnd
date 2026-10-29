import Link from "next/link";
import { fetchApi } from "@/lib/api";
import type { Product, Category } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { ArrowRight, ShoppingCart, Sparkles, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    products = await fetchApi<Product[]>("/api/products/?limit=8");
    categories = await fetchApi<Category[]>("/api/categories/");
  } catch (error) {
    console.error("Failed to load initial storefront data:", error);
  }

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 via-background to-background py-20 md:py-32">
        <div className="container mx-auto px-4 flex flex-col items-center text-center max-w-3xl">
          <Badge variant="outline" className="mb-4 flex items-center gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Next.js 15 + FastAPI Architecture
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            The Next-Generation <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Commerce Experience</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Ultra-fast headless commerce with Next.js 15 App Router, Auth.js security, and a high-throughput async FastAPI backend.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="flex items-center gap-2">
                Browse Products
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Customer Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Browse Categories</h2>
            <Link href="/products" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`}>
                <Card className="p-6 transition hover:shadow-md hover:border-primary/50 text-center">
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {cat.description || "Discover top picks"}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Hand-picked gear with live inventory</p>
          </div>
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">
            All Products
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center border rounded-xl bg-muted/20">
            <p className="text-muted-foreground">No products available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => {
              const primaryVariant = prod.variants?.[0];
              const price = primaryVariant?.price ?? 0;
              const discountPrice = primaryVariant?.discount_price;
              const imageUrl = prod.images?.[0] || primaryVariant?.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

              return (
                <Card key={prod.id} className="overflow-hidden flex flex-col group transition hover:shadow-lg">
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt={prod.name}
                      className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
                    />
                    {discountPrice && (
                      <Badge className="absolute top-3 right-3 bg-red-600 text-white">
                        Sale
                      </Badge>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base leading-snug line-clamp-1 group-hover:text-primary transition">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {prod.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div>
                        {discountPrice ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-extrabold text-foreground">${discountPrice.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground line-through">${price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-extrabold text-foreground">${price.toFixed(2)}</span>
                        )}
                      </div>

                      <Link href={`/products/${prod.slug}`}>
                        <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 border rounded-2xl bg-muted/30">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-base">Full Monorepo Synergy</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Shared types between Next.js and FastAPI with Turborepo task pipeline.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-base">NextAuth v5 + JWT Security</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Stateless HS256 tokens authenticated natively by FastAPI without external bottlenecks.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-base">Async Python Backend</h4>
              <p className="text-sm text-muted-foreground mt-1">
                SQLAlchemy 2.0 async engine with Alembic database migrations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

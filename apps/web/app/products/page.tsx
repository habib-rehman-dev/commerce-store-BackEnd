import Link from "next/link";
import { fetchApi } from "@/lib/api";
import type { Product, Category } from "@workspace/types";
import { Card } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

interface Props {
  searchParams: Promise<{ categoryId?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { categoryId } = await searchParams;
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const query = categoryId ? `?categoryId=${categoryId}` : "";
    products = await fetchApi<Product[]>(`/api/products/${query}`);
    categories = await fetchApi<Category[]>("/api/categories/");
  } catch (err) {
    console.error("Products error:", err);
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Products Catalog</h1>
        <p className="text-muted-foreground mt-1 text-sm">Discover high quality gear and apparel</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Link href="/products">
          <Button variant={!categoryId ? "default" : "outline"} size="sm">
            All Products
          </Button>
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/products?categoryId=${c.id}`}>
            <Button variant={categoryId === c.id ? "default" : "outline"} size="sm">
              {c.name}
            </Button>
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="p-16 text-center border rounded-xl bg-muted/20">
          <p className="text-muted-foreground">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((prod) => {
            const v = prod.variants?.[0];
            const price = v?.price ?? 0;
            const discountPrice = v?.discount_price;
            const img = prod.images?.[0] || v?.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

            return (
              <Card key={prod.id} className="overflow-hidden flex flex-col group transition hover:shadow-lg">
                <div className="aspect-square bg-muted overflow-hidden relative">
                  <img
                    src={img}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {discountPrice && (
                    <Badge className="absolute top-3 right-3 bg-red-600 text-white">Sale</Badge>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base line-clamp-1">{prod.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prod.description}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div>
                      {discountPrice ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-lg">${discountPrice.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground line-through">${price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-lg">${price.toFixed(2)}</span>
                      )}
                    </div>
                    <Link href={`/products/${prod.slug}`}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

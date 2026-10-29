"use client";

import { FormEvent, useState } from "react";
import type { Brand, Category, Product } from "@workspace/types";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { fetchApi } from "@/lib/api";

type Props = {
  token: string;
  initialProducts: Product[];
  initialCategories: Category[];
  initialBrands: Brand[];
};

type CatalogState = {
  products: Product[];
  categories: Category[];
  brands: Brand[];
};

type UploadedImage = {
  url: string;
  public_id: string;
};

const emptyCatalog = {
  name: "",
  slug: "",
  description: "",
};

export function AdminCatalog({
  token,
  initialProducts,
  initialCategories,
  initialBrands,
}: Props) {
  const [catalog, setCatalog] = useState<CatalogState>({
    products: initialProducts,
    categories: initialCategories,
    brands: initialBrands,
  });
  const [category, setCategory] = useState(emptyCatalog);
  const [brand, setBrand] = useState(emptyCatalog);
  const [product, setProduct] = useState({
    ...emptyCatalog,
    category_id: initialCategories[0]?.id ?? "",
    brand_id: initialBrands[0]?.id ?? "",
    sku: "",
    price: "",
    stock: "0",
    image: null as File | null,
  });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function refreshCatalog() {
    const [products, categories, brands] = await Promise.all([
      fetchApi<Product[]>("/api/products/?limit=50", { token }),
      fetchApi<Category[]>("/api/categories/", { token }),
      fetchApi<Brand[]>("/api/brands/", { token }),
    ]);
    setCatalog({ products, categories, brands });
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
    path: string,
    body: unknown,
    reset: () => void,
  ) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      await fetchApi(path, {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      reset();
      await refreshCatalog();
      setMessage("Saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setIsSaving(true);
      setMessage("");
      let uploadedImage: UploadedImage | null = null;
      try {
        if (product.image) {
          const formData = new FormData();
          formData.append("image", product.image);
          uploadedImage = await fetchApi<UploadedImage>("/api/products/images", {
            method: "POST",
            token,
            body: formData,
          });
        }

        await fetchApi("/api/products/", {
          method: "POST",
          token,
          body: JSON.stringify({
            name: product.name,
            slug: product.slug,
            description: product.description || null,
            category_id: product.category_id,
            brand_id: product.brand_id,
            images: uploadedImage ? [uploadedImage.url] : [],
            image_public_ids: uploadedImage ? [uploadedImage.public_id] : [],
            status: "active",
            variants: [
              {
                sku: product.sku,
                attributes: {},
                price: Number(product.price),
                stock: Number(product.stock),
                images: uploadedImage ? [uploadedImage.url] : [],
              },
            ],
          }),
        });
        setProduct({
          ...product,
          ...emptyCatalog,
          sku: "",
          price: "",
          stock: "0",
          image: null,
        });
        await refreshCatalog();
        setMessage("Product and image saved successfully.");
      } catch (error) {
        if (uploadedImage) {
          await fetchApi(
            `/api/products/images?public_id=${encodeURIComponent(uploadedImage.public_id)}`,
            { method: "DELETE", token },
          ).catch(() => undefined);
        }
        setMessage(error instanceof Error ? error.message : "Unable to save product.");
      } finally {
        setIsSaving(false);
      }
  }

  async function deleteProduct(productId: string) {
      if (!window.confirm("Delete this product and its Cloudinary images?")) return;
      setIsSaving(true);
      setMessage("");
      try {
        await fetchApi(`/api/products/${productId}`, {
          method: "DELETE",
          token,
        });
        await refreshCatalog();
        setMessage("Product and associated image deleted.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to delete product.");
      } finally {
        setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm" role="status">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add category</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={(event) =>
                submit(event, "/api/categories/", category, () => setCategory(emptyCatalog))
              }
            >
              <Input
                placeholder="Category name"
                value={category.name}
                onChange={(event) => setCategory({ ...category, name: event.target.value })}
                required
              />
              <Input
                placeholder="slug"
                value={category.slug}
                onChange={(event) => setCategory({ ...category, slug: event.target.value })}
                required
              />
              <Input
                placeholder="Short description"
                value={category.description}
                onChange={(event) =>
                  setCategory({ ...category, description: event.target.value })
                }
              />
              <Button disabled={isSaving}>Create category</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add brand</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={(event) =>
                submit(event, "/api/brands/", brand, () => setBrand(emptyCatalog))
              }
            >
              <Input
                placeholder="Brand name"
                value={brand.name}
                onChange={(event) => setBrand({ ...brand, name: event.target.value })}
                required
              />
              <Input
                placeholder="slug"
                value={brand.slug}
                onChange={(event) => setBrand({ ...brand, slug: event.target.value })}
                required
              />
              <Input
                placeholder="Short description"
                value={brand.description}
                onChange={(event) => setBrand({ ...brand, description: event.target.value })}
              />
              <Button disabled={isSaving}>Create brand</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add product</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={createProduct}
          >
            <Input
              placeholder="Product name"
              value={product.name}
              onChange={(event) => setProduct({ ...product, name: event.target.value })}
              required
            />
            <Input
              placeholder="slug"
              value={product.slug}
              onChange={(event) => setProduct({ ...product, slug: event.target.value })}
              required
            />
            <Input
              placeholder="SKU"
              value={product.sku}
              onChange={(event) => setProduct({ ...product, sku: event.target.value })}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={product.price}
              onChange={(event) => setProduct({ ...product, price: event.target.value })}
              required
            />
            <Input
              type="number"
              min="0"
              placeholder="Stock"
              value={product.stock}
              onChange={(event) => setProduct({ ...product, stock: event.target.value })}
              required
            />
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
              onChange={(event) =>
                setProduct({ ...product, image: event.target.files?.[0] ?? null })
              }
            />
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm"
              value={product.category_id}
              onChange={(event) => setProduct({ ...product, category_id: event.target.value })}
              required
            >
              <option value="">Select category</option>
              {catalog.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm"
              value={product.brand_id}
              onChange={(event) => setProduct({ ...product, brand_id: event.target.value })}
              required
            >
              <option value="">Select brand</option>
              {catalog.brands.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Input
              className="md:col-span-2"
              placeholder="Description"
              value={product.description}
              onChange={(event) => setProduct({ ...product, description: event.target.value })}
            />
            <Button className="md:col-span-2" disabled={isSaving || !token}>
              Create product
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent products</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {catalog.products.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.slug} · {item.variants?.length ?? 0} variant(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
              <Badge variant={item.status === "active" ? "default" : "secondary"}>
                {item.status}
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isSaving}
                onClick={() => deleteProduct(item.id)}
              >
                Delete
              </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

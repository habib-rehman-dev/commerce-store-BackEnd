import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchApi } from "@/lib/api";
import type { Product, Category, Brand, Order } from "@workspace/types";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Shield, Package, FolderTree, Tag, ShoppingBag } from "lucide-react";
import { AdminCatalog } from "@/components/admin/AdminCatalog";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/dashboard");
  }

  let products: Product[] = [];
  let categories: Category[] = [];
  let brands: Brand[] = [];
  let orders: Order[] = [];
  const token = session.accessToken;

  try {
    products = await fetchApi<Product[]>("/api/products/?limit=10", { token });
    categories = await fetchApi<Category[]>("/api/categories/", { token });
    brands = await fetchApi<Brand[]>("/api/brands/", { token });
    orders = await fetchApi<Order[]>("/api/orders/", { token }).catch(() => []);
  } catch (e) {
    console.error("Admin dashboard fetch error:", e);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-1">
            <Shield className="w-5 h-5" />
            <span>Admin Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Store Overview & Operations</h1>
        </div>
        <Badge variant="default">Admin Authenticated</Badge>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-500" />
            <div>
              <span className="text-2xl font-bold">{products.length}</span>
              <p className="text-xs text-muted-foreground">Active Products</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <FolderTree className="w-6 h-6 text-emerald-500" />
            <div>
              <span className="text-2xl font-bold">{categories.length}</span>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Tag className="w-6 h-6 text-purple-500" />
            <div>
              <span className="text-2xl font-bold">{brands.length}</span>
              <p className="text-xs text-muted-foreground">Brands</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
            <div>
              <span className="text-2xl font-bold">{orders.length}</span>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
          </div>
        </Card>
      </div>

      <AdminCatalog
        token={token ?? ""}
        initialProducts={products}
        initialCategories={categories}
        initialBrands={brands}
      />
    </div>
  );
}

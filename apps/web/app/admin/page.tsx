import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchApi } from "@/lib/api";
import type { Product, Category, Brand, Order, Coupon, User } from "@workspace/types";
import { Badge } from "@workspace/ui/components/badge";
import { Shield } from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/dashboard");
  }

  const token = session.accessToken;
  let products: Product[] = [];
  let categories: Category[] = [];
  let brands: Brand[] = [];
  let orders: Order[] = [];
  let coupons: Coupon[] = [];
  let users: User[] = [];
  let stats = {
    total_revenue: 0,
    total_orders: 0,
    pending_orders: 0,
    total_products: 0,
    total_users: 0,
  };

  try {
    const [prods, cats, brs, ords, cpn, usrs, statData] = await Promise.all([
      fetchApi<Product[]>("/api/products/?limit=100", { token }).catch(() => []),
      fetchApi<Category[]>("/api/categories/", { token }).catch(() => []),
      fetchApi<Brand[]>("/api/brands/", { token }).catch(() => []),
      fetchApi<Order[]>("/api/orders/", { token }).catch(() => []),
      fetchApi<Coupon[]>("/api/coupons/", { token }).catch(() => []),
      fetchApi<User[]>("/api/users/", { token }).catch(() => []),
      fetchApi<typeof stats>("/api/orders/admin/stats", { token }).catch(() => ({
        total_revenue: 0,
        total_orders: 0,
        pending_orders: 0,
        total_products: 0,
        total_users: 0,
      })),
    ]);

    products = prods;
    categories = cats;
    brands = brs;
    orders = ords;
    coupons = cpn;
    users = usrs;
    stats = statData;
  } catch (e) {
    console.error("Admin dashboard fetch error:", e);
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-1 text-sm">
            <Shield className="w-4 h-4" />
            <span>Store Operations & Control</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Management Console</h1>
        </div>
        <Badge variant="default" className="w-fit">Administrator Active</Badge>
      </div>

      <AdminDashboard
        token={token ?? ""}
        initialProducts={products}
        initialCategories={categories}
        initialBrands={brands}
        initialOrders={orders}
        initialCoupons={coupons}
        initialUsers={users}
        stats={stats}
      />
    </div>
  );
}

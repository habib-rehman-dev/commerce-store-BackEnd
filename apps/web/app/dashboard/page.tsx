import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import type { Order } from "@workspace/types";
import { Card, CardHeader, CardTitle, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { User, Package, MapPin, ExternalLink, ShoppingBag } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user;
  const role = (user as any)?.role || "customer";

  // Redirect admin directly to admin console
  if (role === "admin") {
    redirect("/admin");
  }

  let orders: Order[] = [];
  if (session.accessToken) {
    try {
      orders = await fetchApi<Order[]>("/api/orders/my-orders", {
        token: session.accessToken,
      });
    } catch {
      // Empty orders
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Account Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your orders, deliveries, and account details
          </p>
        </div>
        <Badge variant="outline" className="capitalize">{role}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base">Profile Details</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Name</span>
              <span className="font-medium">{user.name || "N/A"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base">Orders Placed</h3>
          </div>
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime total orders</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base">Shipping Destination</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {orders[0]?.shipping_address
              ? `${orders[0].shipping_address.city}, ${orders[0].shipping_address.country}`
              : "Configured upon placing an order."}
          </p>
        </Card>
      </div>

      {/* Orders List */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          My Orders ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="p-12 border rounded-xl bg-muted/20 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-semibold">No orders placed yet</h4>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Explore our products catalog and complete your first checkout!
            </p>
            <Link href="/products">
              <Button size="sm">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      ORDER #{order.id.slice(0, 8)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"} className="capitalize">
                      {order.payment_status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {order.status}
                    </Badge>
                    <span className="font-bold text-base ml-2">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 divide-y">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-2 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-xs">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku} · Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-xs">${item.line_total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.shipping_address && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    Shipped to: {order.shipping_address.address_line1}, {order.shipping_address.city}, {order.shipping_address.country}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, FormEvent } from "react";
import type { Product, Category, Brand, Order, Coupon, User } from "@workspace/types";
import { fetchApi } from "@/lib/api";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import {
  Package,
  FolderTree,
  Tag,
  ShoppingBag,
  Users,
  Ticket,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  Check,
  ChevronRight,
  ExternalLink,
  Shield,
  Loader2
} from "lucide-react";

type Props = {
  token: string;
  initialProducts: Product[];
  initialCategories: Category[];
  initialBrands: Brand[];
  initialOrders: Order[];
  initialCoupons: Coupon[];
  initialUsers: User[];
  stats: {
    total_revenue: number;
    total_orders: number;
    pending_orders: number;
    total_products: number;
    total_users: number;
  };
};

type UploadedImage = {
  url: string;
  public_id: string;
};

export function AdminDashboard({
  token,
  initialProducts,
  initialCategories,
  initialBrands,
  initialOrders,
  initialCoupons,
  initialUsers,
  stats,
}: Props) {
  // 1. Optimistic lists for entities
  const productsList = useOptimisticList<Product>(initialProducts);
  const categoriesList = useOptimisticList<Category>(initialCategories);
  const brandsList = useOptimisticList<Brand>(initialBrands);
  const ordersList = useOptimisticList<Order>(initialOrders);
  const couponsList = useOptimisticList<Coupon>(initialCoupons);
  const usersList = useOptimisticList<User>(initialUsers);

  // Form states
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "" });
  const [newBrand, setNewBrand] = useState({ name: "", slug: "", description: "" });
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "10",
    min_order_value: "50",
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    description: "",
    category_id: initialCategories[0]?.id || "",
    brand_id: initialBrands[0]?.id || "",
    sku: "",
    price: "",
    stock: "10",
    image: null as File | null,
  });

  const [productSearch, setProductSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function notify(msg: string) {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  }

  // --- PRODUCT ACTIONS (OPTIMISTIC) ---
  async function handleDeleteProduct(id: string) {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    await productsList.removeOptimistic(id, async () => {
      await fetchApi(`/api/products/${id}`, { method: "DELETE", token });
      notify("Product deleted successfully");
    });
  }

  async function handleCreateProduct(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    let uploadedImage: UploadedImage | null = null;

    try {
      if (newProduct.image) {
        const formData = new FormData();
        formData.append("image", newProduct.image);
        uploadedImage = await fetchApi<UploadedImage>("/api/products/images", {
          method: "POST",
          token,
          body: formData,
        });
      }

      const created = await fetchApi<Product>("/api/products/", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: newProduct.name,
          slug: newProduct.slug,
          description: newProduct.description || null,
          category_id: newProduct.category_id,
          brand_id: newProduct.brand_id,
          images: uploadedImage ? [uploadedImage.url] : [],
          image_public_ids: uploadedImage ? [uploadedImage.public_id] : [],
          status: "active",
          variants: [
            {
              sku: newProduct.sku,
              attributes: {},
              price: parseFloat(newProduct.price),
              stock: parseInt(newProduct.stock, 10),
              images: uploadedImage ? [uploadedImage.url] : [],
            },
          ],
        }),
      });

      productsList.setItems([created, ...productsList.items]);
      setNewProduct({
        name: "",
        slug: "",
        description: "",
        category_id: categoriesList.items[0]?.id || "",
        brand_id: brandsList.items[0]?.id || "",
        sku: "",
        price: "",
        stock: "10",
        image: null,
      });
      notify("Product created successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating product");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- CATEGORY ACTIONS (OPTIMISTIC) ---
  async function handleDeleteCategory(id: string) {
    if (!window.confirm("Delete this category?")) return;
    await categoriesList.removeOptimistic(id, async () => {
      await fetchApi(`/api/categories/${id}`, { method: "DELETE", token });
      notify("Category deleted");
    });
  }

  async function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await fetchApi<Category>("/api/categories/", {
        method: "POST",
        token,
        body: JSON.stringify(newCategory),
      });
      categoriesList.setItems([created, ...categoriesList.items]);
      setNewCategory({ name: "", slug: "", description: "" });
      notify("Category created");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating category");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- BRAND ACTIONS (OPTIMISTIC) ---
  async function handleDeleteBrand(id: string) {
    if (!window.confirm("Delete this brand?")) return;
    await brandsList.removeOptimistic(id, async () => {
      await fetchApi(`/api/brands/${id}`, { method: "DELETE", token });
      notify("Brand deleted");
    });
  }

  async function handleCreateBrand(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await fetchApi<Brand>("/api/brands/", {
        method: "POST",
        token,
        body: JSON.stringify(newBrand),
      });
      brandsList.setItems([created, ...brandsList.items]);
      setNewBrand({ name: "", slug: "", description: "" });
      notify("Brand created");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating brand");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- COUPON ACTIONS (OPTIMISTIC) ---
  async function handleDeleteCoupon(id: string) {
    if (!window.confirm("Delete this coupon?")) return;
    await couponsList.removeOptimistic(id, async () => {
      await fetchApi(`/api/coupons/${id}`, { method: "DELETE", token });
      notify("Coupon deleted");
    });
  }

  async function handleCreateCoupon(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await fetchApi<Coupon>("/api/coupons/", {
        method: "POST",
        token,
        body: JSON.stringify({
          code: newCoupon.code.toUpperCase(),
          discount_type: newCoupon.discount_type,
          discount_value: parseFloat(newCoupon.discount_value),
          min_order_value: parseFloat(newCoupon.min_order_value) || 0,
          status: "active",
        }),
      });
      couponsList.setItems([created, ...couponsList.items]);
      setNewCoupon({
        code: "",
        discount_type: "percentage",
        discount_value: "10",
        min_order_value: "50",
      });
      notify("Coupon created");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating coupon");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- ORDER STATUS UPDATE (OPTIMISTIC) ---
  async function handleUpdateOrderStatus(orderId: string, newStatus: string) {
    await ordersList.updateOptimistic(
      orderId,
      { status: newStatus as any },
      async () => {
        await fetchApi(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          token,
          body: JSON.stringify({ status: newStatus }),
        });
        notify(`Order status updated to ${newStatus}`);
      }
    );
  }

  async function handleUpdateOrderPayment(orderId: string, newPaymentStatus: string) {
    await ordersList.updateOptimistic(
      orderId,
      { payment_status: newPaymentStatus as any },
      async () => {
        await fetchApi(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          token,
          body: JSON.stringify({ payment_status: newPaymentStatus }),
        });
        notify(`Payment status updated to ${newPaymentStatus}`);
      }
    );
  }

  // --- USER ACTIONS (OPTIMISTIC) ---
  async function handleToggleUserRole(user: User) {
    const newRole = user.role === "admin" ? "customer" : "admin";
    await usersList.updateOptimistic(user.id, { role: newRole }, async () => {
      await fetchApi(`/api/users/${user.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ role: newRole }),
      });
      notify(`User role updated to ${newRole}`);
    });
  }

  async function handleToggleUserStatus(user: User) {
    const newStatus = user.status === "active" ? "inactive" : "active";
    await usersList.updateOptimistic(user.id, { status: newStatus }, async () => {
      await fetchApi(`/api/users/${user.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: newStatus }),
      });
      notify(`User status updated to ${newStatus}`);
    });
  }

  // Filtered products
  const filteredProducts = productsList.items.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filtered orders
  const filteredOrders = ordersList.items.filter((o) =>
    orderFilter === "all" ? true : o.status === orderFilter
  );

  const anyError =
    productsList.error ||
    categoriesList.error ||
    brandsList.error ||
    ordersList.error ||
    couponsList.error ||
    usersList.error;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {anyError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Optimistic update failed & was automatically reverted: {anyError}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full h-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="overview" className="text-xs py-2">Overview</TabsTrigger>
          <TabsTrigger value="products" className="text-xs py-2">Products ({productsList.items.length})</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs py-2">Orders ({ordersList.items.length})</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs py-2">Categories</TabsTrigger>
          <TabsTrigger value="brands" className="text-xs py-2">Brands</TabsTrigger>
          <TabsTrigger value="coupons" className="text-xs py-2">Coupons</TabsTrigger>
          <TabsTrigger value="users" className="text-xs py-2">Users</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: OVERVIEW --- */}
        <TabsContent value="overview" className="pt-6 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Revenue</span>
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-2">${stats.total_revenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">From completed orders</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Total Orders</span>
                <ShoppingBag className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{ordersList.items.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ordersList.items.filter((o) => o.status === "pending").length} pending fulfillment
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Active Products</span>
                <Package className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{productsList.items.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Customers</span>
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{usersList.items.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {ordersList.items.slice(0, 5).map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-xs font-bold">#{order.id.slice(0, 8)}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.shipping_address?.full_name || "Customer"} · {order.items?.length ?? 0} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      {order.payment_status}
                    </Badge>
                    <Badge variant="outline">{order.status}</Badge>
                    <span className="font-bold text-sm min-w-[70px] text-right">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              {ordersList.items.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">No orders yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: PRODUCTS --- */}
        <TabsContent value="products" className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Input
              placeholder="Search products by title or slug..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Create Product Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" /> Add New Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProduct} className="space-y-3">
                  <Input
                    placeholder="Product name *"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="URL slug *"
                    value={newProduct.slug}
                    onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="SKU *"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      required
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price ($) *"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Stock quantity *"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      required
                    />
                    <select
                      className="h-9 rounded-lg border bg-background px-3 text-xs"
                      value={newProduct.category_id}
                      onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                      required
                    >
                      <option value="">Category *</option>
                      {categoriesList.items.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    className="w-full h-9 rounded-lg border bg-background px-3 text-xs"
                    value={newProduct.brand_id}
                    onChange={(e) => setNewProduct({ ...newProduct, brand_id: e.target.value })}
                    required
                  >
                    <option value="">Brand *</option>
                    {brandsList.items.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Short description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Product Image (Cloudinary)
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, image: e.target.files?.[0] || null })
                      }
                      className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:text-xs"
                    />
                  </div>
                  <Button disabled={isSubmitting} className="w-full mt-2" size="sm">
                    {isSubmitting ? "Creating..." : "Create Product"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Products List Table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Catalog Inventory ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {filteredProducts.map((p) => {
                  const variant = p.variants?.[0];
                  const img = p.images?.[0] || variant?.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

                  return (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-lg border bg-muted shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            SKU: {variant?.sku || "N/A"} · Stock: {variant?.stock ?? 0}
                          </p>
                          <span className="font-bold text-xs text-primary">
                            ${(variant?.discount_price ?? variant?.price ?? 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs">
                          {p.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-2 h-8"
                          title="Delete Product (Optimistic with rollback)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB 3: ORDERS --- */}
        <TabsContent value="orders" className="pt-6 space-y-6">
          <div className="flex gap-2">
            {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((st) => (
              <Button
                key={st}
                size="sm"
                variant={orderFilter === st ? "default" : "outline"}
                onClick={() => setOrderFilter(st)}
                className="capitalize text-xs"
              >
                {st}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="p-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">#{order.id.slice(0, 8)}</span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {order.payment_method}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Customer: {order.shipping_address?.full_name || "N/A"} · {order.shipping_address?.phone || ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status updater */}
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                      className="h-8 rounded-lg border bg-background px-2 text-xs font-medium"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Payment updater */}
                    <select
                      value={order.payment_status}
                      onChange={(e) => handleUpdateOrderPayment(order.id, e.target.value)}
                      className={`h-8 rounded-lg border px-2 text-xs font-semibold ${
                        order.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-background"
                      }`}
                    >
                      <option value="pending">Payment: Pending</option>
                      <option value="paid">Payment: Paid</option>
                      <option value="failed">Payment: Failed</option>
                      <option value="refunded">Payment: Refunded</option>
                    </select>

                    <span className="text-sm font-extrabold ml-2">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items in order */}
                <div className="pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Items</p>
                  <div className="divide-y text-xs">
                    {order.items?.map((item) => (
                      <div key={item.id} className="py-1.5 flex justify-between">
                        <span>{item.product_name} (x{item.quantity})</span>
                        <span className="font-medium">${item.line_total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.shipping_address && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                    Shipping to: {order.shipping_address.address_line1}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                  </p>
                )}
              </Card>
            ))}

            {filteredOrders.length === 0 && (
              <p className="p-12 text-center text-sm text-muted-foreground border rounded-xl">
                No orders match this status filter.
              </p>
            )}
          </div>
        </TabsContent>

        {/* --- TAB 4: CATEGORIES --- */}
        <TabsContent value="categories" className="pt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-emerald-500" /> Add Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <Input
                    placeholder="Category name *"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="slug *"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                  <Button disabled={isSubmitting} className="w-full" size="sm">
                    Create Category
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Existing Categories ({categoriesList.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {categoriesList.items.map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">/{cat.slug} · {cat.description || "No description"}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-2 h-8"
                      title="Delete Category (Optimistic)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB 5: BRANDS --- */}
        <TabsContent value="brands" className="pt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-500" /> Add Brand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateBrand} className="space-y-3">
                  <Input
                    placeholder="Brand name *"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="slug *"
                    value={newBrand.slug}
                    onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Description"
                    value={newBrand.description}
                    onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                  />
                  <Button disabled={isSubmitting} className="w-full" size="sm">
                    Create Brand
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Existing Brands ({brandsList.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {brandsList.items.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{b.name}</p>
                      <p className="text-xs text-muted-foreground">/{b.slug} · {b.description || "No description"}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteBrand(b.id)}
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-2 h-8"
                      title="Delete Brand (Optimistic)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB 6: COUPONS --- */}
        <TabsContent value="coupons" className="pt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-amber-500" /> Create Coupon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCoupon} className="space-y-3">
                  <Input
                    placeholder="Code (e.g. SAVE20) *"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    required
                    className="uppercase"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="h-9 rounded-lg border bg-background px-3 text-xs"
                      value={newCoupon.discount_type}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="Discount value *"
                      value={newCoupon.discount_value}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Min Order Value ($)"
                    value={newCoupon.min_order_value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, min_order_value: e.target.value })}
                  />
                  <Button disabled={isSubmitting} className="w-full" size="sm">
                    Create Coupon
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Active Coupons ({couponsList.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {couponsList.items.map((cp) => (
                  <div key={cp.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded">
                          {cp.code}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {cp.discount_type === "percentage" ? `${cp.discount_value}% OFF` : `$${cp.discount_value} OFF`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Min spend: ${cp.min_order_value ?? 0} · Used {cp.used_count} time(s)
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCoupon(cp.id)}
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-2 h-8"
                      title="Delete Coupon (Optimistic)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {couponsList.items.length === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">No coupons found.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB 7: USERS --- */}
        <TabsContent value="users" className="pt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                User Management ({usersList.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {usersList.items.map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{user.name || "User"}</p>
                      <Badge variant={user.role === "admin" ? "default" : "outline"} className="capitalize text-xs">
                        {user.role}
                      </Badge>
                      <Badge variant={user.status === "active" ? "secondary" : "destructive"} className="text-xs">
                        {user.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{user.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleUserRole(user)}
                      className="text-xs h-8"
                    >
                      Set as {user.role === "admin" ? "Customer" : "Admin"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleUserStatus(user)}
                      className="text-xs h-8 text-muted-foreground hover:text-foreground"
                    >
                      {user.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: "customer" | "admin";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  image_public_id?: string | null;
  parent_category_id?: string | null;
  status: "active" | "inactive";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  logo_public_id?: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  discount_price?: number | null;
  stock: number;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category_id: string;
  brand_id: string;
  images: string[];
  image_public_ids: string[];
  status: "active" | "inactive";
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface Specification {
  id: string;
  name: string;
  category_id: string;
  values: string[];
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  product?: Product;
}

export interface Wishlist {
  id: string;
  user_id: string;
  items: WishlistItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderShippingAddress {
  id?: string;
  order_id?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  sku: string;
  attributes: Record<string, string>;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  user_id: string;
  subtotal: number;
  discount: number;
  coupon_code?: string | null;
  shipping_fee: number;
  total: number;
  currency: string;
  payment_method: "stripe" | "cod";
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  items: OrderItem[];
  shipping_address?: OrderShippingAddress;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  stripe_payment_intent_id: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value?: number | null;
  max_uses?: number | null;
  used_count: number;
  expires_at?: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title?: string | null;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-12 text-muted-foreground">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <span className="font-bold text-foreground text-lg">CommerceStore</span>
          <p className="mt-2 text-sm">
            High performance modern e-commerce storefront powered by Next.js 15, Turborepo, and FastAPI.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground text-sm mb-3">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-foreground">All Products</Link></li>
            <li><Link href="/products?categoryId=electronics" className="hover:text-foreground">Electronics</Link></li>
            <li><Link href="/products?categoryId=apparel" className="hover:text-foreground">Apparel</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-foreground text-sm mb-3">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard" className="hover:text-foreground">My Profile</Link></li>
            <li><Link href="/cart" className="hover:text-foreground">Shopping Bag</Link></li>
            <li><Link href="/sign-in" className="hover:text-foreground">Sign In</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-foreground text-sm mb-3">Platform</h4>
          <p className="text-xs">
            FastAPI Backend • Next.js 15 App Router • SQLite / PostgreSQL • Auth.js v5 • Tailwind v4
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-6 border-t text-xs text-center">
        © {new Date().getFullYear()} CommerceStore. All rights reserved.
      </div>
    </footer>
  );
}

import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { ShoppingBag, Shield, User as UserIcon } from "lucide-react";

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const role = (user as any)?.role;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground hover:opacity-90">
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-sm font-black">CS</span>
            CommerceStore
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="transition hover:text-foreground">
              Home
            </Link>
            <Link href="/products" className="transition hover:text-foreground">
              Products
            </Link>
            {role === "admin" && (
              <Link href="/admin" className="flex items-center gap-1 transition text-amber-600 dark:text-amber-400 font-semibold hover:opacity-80">
                <Shield className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/cart">
            <Button variant="outline" size="sm" className="relative flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase">
                  {user.name ? user.name[0] : "U"}
                </div>
                <span className="hidden sm:inline">{user.name || user.email}</span>
                {role === "admin" && <Badge variant="secondary">Admin</Badge>}
              </Link>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const middlewareHandler = auth(async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isProtected = pathname.startsWith("/dashboard") ||
                      pathname.startsWith("/orders") ||
                      pathname.startsWith("/cart") ||
                      pathname.startsWith("/checkout");

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/sign-in" || pathname === "/sign-up";

  if (isAuthRoute && isLoggedIn) {
    const role = (req.auth?.user as any)?.role;
    return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/dashboard", req.url));
  }

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    const role = (req.auth?.user as any)?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export default middlewareHandler as any;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

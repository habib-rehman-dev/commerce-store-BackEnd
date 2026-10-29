import { signIn } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
  }
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard";

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to access your orders and account
          </p>
        </div>

        {/* Google OAuth Button */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
          className="mb-6"
        >
          <Button variant="outline" className="w-full flex items-center justify-center gap-2" type="submit">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </Button>
        </form>

        <div className="relative mb-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground uppercase">
            Or with credentials
          </span>
        </div>

        {/* Credentials Form */}
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-semibold block mb-1.5">Email Address</label>
            <Input
              name="email"
              type="email"
              placeholder="customer@commerce.local"
              defaultValue="customer@commerce.local"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5">Password</label>
            <Input
              name="password"
              type="password"
              defaultValue="password123"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Sign In with Email
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </Card>
    </div>
  );
}

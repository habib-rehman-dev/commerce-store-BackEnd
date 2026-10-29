import Link from "next/link";
import { signIn } from "@/lib/auth";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Create an Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join CommerceStore to track orders and checkout faster
          </p>
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            const response = await fetch(
              `${process.env.API_URL || "http://127.0.0.1:8000"}/api/auth/register`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: formData.get("name"),
                  email: formData.get("email"),
                  password: formData.get("password"),
                }),
                cache: "no-store",
              },
            );
            if (!response.ok) {
              const error = await response.json().catch(() => ({}));
              throw new Error(error.detail || "Unable to create account");
            }
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: "/dashboard",
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-semibold block mb-1.5">Full Name</label>
            <Input name="name" type="text" placeholder="John Doe" required />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5">Email Address</label>
            <Input name="email" type="email" placeholder="john@example.com" required />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5">Password</label>
            <Input
              name="password"
              type="password"
              minLength={8}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
              title="Use at least 8 characters with uppercase, lowercase, and a number"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}

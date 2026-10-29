import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect("/sign-in?callbackUrl=/checkout");
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Secure checkout</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Complete your order</h1>
        <p className="mt-1 text-muted-foreground">
          Choose a payment method and provide your delivery address.
        </p>
      </div>
      <CheckoutForm token={session.accessToken} />
    </div>
  );
}

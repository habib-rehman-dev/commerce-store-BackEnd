import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { User, Package, MapPin } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user;
  const role = (user as any)?.role || "customer";

  // Credentials authentication stores the role in the JWT. Keep the generic
  // account route as the post-login target, then send administrators to their
  // dedicated workspace.
  if (role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Account Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage orders, addresses, and personal profile</p>
        </div>
        <Badge variant="outline" className="capitalize">{role}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base">Orders</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            You currently have no active orders. All fulfilled shipments will appear here.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base">Shipping Addresses</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Default shipping address not configured yet.
          </p>
        </Card>
      </div>
    </div>
  );
}

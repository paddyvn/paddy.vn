import { ShopifySync } from "@/components/ShopifySync";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to your Paddy.vn admin panel</p>
      </div>

      <div className="max-w-3xl">
        <ShopifySync />
      </div>

      <div className="text-center text-sm text-muted-foreground py-8">
        <p>More admin features coming soon...</p>
      </div>
    </div>
  );
}
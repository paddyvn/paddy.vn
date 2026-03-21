import { useState } from "react";
import { RefreshCw, Package, ShoppingCart, Users, Tag, Link2, ShoppingBag, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSyncProducts } from "@/hooks/useSyncProducts";
import { useSyncCollections } from "@/hooks/useSyncCollections";
import { useSyncProductCollections } from "@/hooks/useSyncProductCollections";
import { useSyncOrders } from "@/hooks/useSyncOrders";
import { useSyncCustomers } from "@/hooks/useSyncCustomers";
import { useSyncAbandonedCheckouts } from "@/hooks/useSyncAbandonedCheckouts";
import { useSyncBrands } from "@/hooks/useSyncBrands";

type SyncStatus = "idle" | "running" | "success" | "error";

interface SyncCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: SyncStatus;
  progress?: { current: number; total: number };
  onSync: () => void;
  disabled: boolean;
  buttonLabel?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const statusConfig: Record<SyncStatus, { badge: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  idle: { badge: "Ready", variant: "outline" },
  running: { badge: "Syncing…", variant: "default" },
  success: { badge: "Complete", variant: "secondary" },
  error: { badge: "Failed", variant: "destructive" },
};

const StatusIcon = ({ status }: { status: SyncStatus }) => {
  switch (status) {
    case "running": return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error": return <XCircle className="h-4 w-4 text-destructive" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const SyncCard = ({ title, description, icon, status, progress, onSync, disabled, buttonLabel, secondaryAction }: SyncCardProps) => {
  const cfg = statusConfig[status];
  return (
    <Card className="relative overflow-hidden">
      {status === "running" && progress && progress.current > 0 && (
        <Progress value={100} className="absolute top-0 left-0 right-0 h-1 rounded-none" />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              {icon}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon status={status} />
            <Badge variant={cfg.variant} className="text-xs">
              {status === "running" && progress && progress.current > 0
                ? `${progress.current} synced`
                : cfg.badge}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onSync}
            disabled={disabled}
            className="flex-1"
          >
            {status === "running" ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Syncing…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                {buttonLabel || "Sync Now"}
              </>
            )}
          </Button>
          {secondaryAction && (
            <Button
              size="sm"
              variant="outline"
              onClick={secondaryAction.onClick}
              disabled={disabled}
              className="flex-1"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SyncDashboard = () => {
  const [statuses, setStatuses] = useState<Record<string, SyncStatus>>({});

  const setStatus = (key: string, status: SyncStatus) =>
    setStatuses((prev) => ({ ...prev, [key]: status }));

  const products = useSyncProducts();
  const collections = useSyncCollections();
  const productCollections = useSyncProductCollections();
  const orders = useSyncOrders();
  const customers = useSyncCustomers();
  const abandonedCheckouts = useSyncAbandonedCheckouts();
  const brands = useSyncBrands();

  const isAnySyncing = products.isPending || collections.isPending || productCollections.isPending || orders.isPending || customers.isPending || abandonedCheckouts.isPending || brands.isPending;

  const wrapSync = (key: string, mutate: () => void) => {
    setStatus(key, "running");
    mutate();
  };

  // Track statuses via effects-like approach using mutation states
  const getStatus = (key: string, isPending: boolean, isSuccess: boolean, isError: boolean): SyncStatus => {
    if (isPending) return "running";
    if (isSuccess && statuses[key] !== "idle") return "success";
    if (isError && statuses[key] !== "idle") return "error";
    return statuses[key] || "idle";
  };

  const syncCards = [
    {
      key: "products",
      title: "Products & Variants",
      description: "Sync all products, variants, and images from Shopify",
      icon: <Package className="h-5 w-5 text-muted-foreground" />,
      status: getStatus("products", products.isPending, products.isSuccess, products.isError),
      progress: (products as any).progress,
      onSync: () => wrapSync("products", () => products.mutate()),
    },
    {
      key: "collections",
      title: "Collections",
      description: "Sync all collections (categories) from Shopify",
      icon: <Tag className="h-5 w-5 text-muted-foreground" />,
      status: getStatus("collections", collections.isPending, collections.isSuccess, collections.isError),
      onSync: () => wrapSync("collections", () => collections.mutate()),
    },
    {
      key: "productCollections",
      title: "Product ↔ Collection Links",
      description: "Link products to their collections (run after syncing both)",
      icon: <Link2 className="h-5 w-5 text-muted-foreground" />,
      status: getStatus("productCollections", productCollections.isPending, productCollections.isSuccess, productCollections.isError),
      onSync: () => wrapSync("productCollections", () => productCollections.mutate()),
    },
    {
      key: "brands",
      title: "Brands",
      description: "Sync brand data from Shopify product vendors",
      icon: <ShoppingBag className="h-5 w-5 text-muted-foreground" />,
      status: getStatus("brands", brands.isPending, brands.isSuccess, brands.isError),
      onSync: () => wrapSync("brands", () => brands.mutate()),
    },
    {
      key: "orders",
      title: "Orders",
      description: "Sync orders, line items, fulfillments, and timeline events",
      icon: <ShoppingCart className="h-5 w-5 text-muted-foreground" />,
      status: getStatus("orders", orders.isPending, false, false),
      progress: orders.progress,
      onSync: () => { setStatus("orders", "running"); orders.syncOrders(false); },
      secondaryAction: {
        label: "Full Sync",
        onClick: () => { setStatus("orders", "running"); orders.syncOrders(true); },
      },
    },
    {
      key: "customers",
      title: "Customers",
      description: "Sync all customer profiles from Shopify",
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
      status: getStatus("customers", customers.isPending, customers.isSuccess, customers.isError),
      progress: (customers as any).progress,
      onSync: () => wrapSync("customers", () => customers.mutate()),
    },
    {
      key: "abandonedCheckouts",
      title: "Abandoned Checkouts",
      description: "Sync abandoned checkout data for recovery analysis",
      icon: <ShoppingCart className="h-5 w-5 text-muted-foreground" />,
      status: getStatus("abandonedCheckouts", abandonedCheckouts.isPending, abandonedCheckouts.isSuccess, abandonedCheckouts.isError),
      progress: (abandonedCheckouts as any).progress,
      onSync: () => wrapSync("abandonedCheckouts", () => abandonedCheckouts.mutate()),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Synchronize data from Shopify into your database
          </p>
        </div>
        {isAnySyncing && (
          <Badge variant="default" className="gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Sync in progress
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {syncCards.map((card) => (
          <SyncCard
            key={card.key}
            title={card.title}
            description={card.description}
            icon={card.icon}
            status={card.status}
            progress={card.progress}
            onSync={card.onSync}
            disabled={isAnySyncing}
            secondaryAction={card.secondaryAction}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recommended Sync Order</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Products & Variants — the foundation of your catalog</li>
            <li>Collections — sync category structure</li>
            <li>Product ↔ Collection Links — establish relationships</li>
            <li>Brands — extract vendor data</li>
            <li>Orders & Customers — can run in parallel</li>
            <li>Abandoned Checkouts — for recovery analytics</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncDashboard;

import { useState, useCallback, useRef, useEffect } from "react";
import { RefreshCw, Package, ShoppingCart, Users, Tag, Link2, ShoppingBag, Loader2, CheckCircle2, XCircle, Clock, History } from "lucide-react";
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

interface SyncLogEntry {
  id: number;
  title: string;
  status: "success" | "error";
  timestamp: Date;
}

interface SyncCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: SyncStatus;
  progress?: { current: number; total: number };
  onSync: () => void;
  disabled: boolean;
  buttonLabel?: string;
  secondaryAction?: { label: string; onClick: () => void };
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
    case "success": return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
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
          <Button size="sm" onClick={onSync} disabled={disabled} className="flex-1">
            {status === "running" ? (
              <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Syncing…</>
            ) : (
              <><RefreshCw className="mr-2 h-3.5 w-3.5" />{buttonLabel || "Sync Now"}</>
            )}
          </Button>
          {secondaryAction && (
            <Button size="sm" variant="outline" onClick={secondaryAction.onClick} disabled={disabled} className="flex-1">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const SyncDashboard = () => {
  const [statuses, setStatuses] = useState<Record<string, SyncStatus>>({});
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const logCounterRef = useRef(0);

  const addLogEntry = useCallback((title: string, status: "success" | "error") => {
    const id = logCounterRef.current++;
    setSyncLog((prev) => [{ id, title, status, timestamp: new Date() }, ...prev].slice(0, 7));
  }, []);

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

  const wrapSync = (key: string, title: string, mutate: () => void) => {
    setStatus(key, "running");
    mutate();
  };

  const getStatus = (key: string, isPending: boolean, isSuccess: boolean, isError: boolean): SyncStatus => {
    if (isPending) return "running";
    if (isSuccess && statuses[key] !== "idle") return "success";
    if (isError && statuses[key] !== "idle") return "error";
    return statuses[key] || "idle";
  };

  // Track status transitions and log completed syncs via useEffect
  const prevStatusesRef = useRef<Record<string, SyncStatus>>({});

  const syncEntries = [
    { key: "products", title: "Products & Variants", isPending: products.isPending, isSuccess: products.isSuccess, isError: products.isError },
    { key: "collections", title: "Collections", isPending: collections.isPending, isSuccess: collections.isSuccess, isError: collections.isError },
    { key: "productCollections", title: "Product ↔ Collection Links", isPending: productCollections.isPending, isSuccess: productCollections.isSuccess, isError: productCollections.isError },
    { key: "brands", title: "Brands", isPending: brands.isPending, isSuccess: brands.isSuccess, isError: brands.isError },
    { key: "orders", title: "Orders", isPending: orders.isPending, isSuccess: (orders as any).isSuccess ?? false, isError: (orders as any).isError ?? false },
    { key: "customers", title: "Customers", isPending: customers.isPending, isSuccess: customers.isSuccess, isError: customers.isError },
    { key: "abandonedCheckouts", title: "Abandoned Checkouts", isPending: abandonedCheckouts.isPending, isSuccess: abandonedCheckouts.isSuccess, isError: abandonedCheckouts.isError },
  ];

  useEffect(() => {
    syncEntries.forEach(({ key, title, isPending, isSuccess, isError }) => {
      const current = getStatus(key, isPending, isSuccess, isError);
      const prev = prevStatusesRef.current[key];
      if (prev === "running" && current === "success") {
        addLogEntry(title, "success");
      } else if (prev === "running" && current === "error") {
        addLogEntry(title, "error");
      }
      prevStatusesRef.current[key] = current;
    });
  });

  const syncCards = [
    {
      key: "products", title: "Products & Variants",
      description: "Sync all products, variants, and images from Shopify",
      icon: <Package className="h-5 w-5 text-muted-foreground" />,
      status: checkAndLog("products", "Products & Variants", products.isPending, products.isSuccess, products.isError),
      progress: (products as any).progress,
      onSync: () => wrapSync("products", "Products & Variants", () => products.mutate()),
    },
    {
      key: "collections", title: "Collections",
      description: "Sync all collections (categories) from Shopify",
      icon: <Tag className="h-5 w-5 text-muted-foreground" />,
      status: checkAndLog("collections", "Collections", collections.isPending, collections.isSuccess, collections.isError),
      onSync: () => wrapSync("collections", "Collections", () => collections.mutate()),
    },
    {
      key: "productCollections", title: "Product ↔ Collection Links",
      description: "Link products to their collections (run after syncing both)",
      icon: <Link2 className="h-5 w-5 text-muted-foreground" />,
      status: checkAndLog("productCollections", "Product ↔ Collection Links", productCollections.isPending, productCollections.isSuccess, productCollections.isError),
      onSync: () => wrapSync("productCollections", "Product ↔ Collection Links", () => productCollections.mutate()),
    },
    {
      key: "brands", title: "Brands",
      description: "Sync brand data from Shopify product vendors",
      icon: <ShoppingBag className="h-5 w-5 text-muted-foreground" />,
      status: checkAndLog("brands", "Brands", brands.isPending, brands.isSuccess, brands.isError),
      onSync: () => wrapSync("brands", "Brands", () => brands.mutate()),
    },
    {
      key: "orders", title: "Orders",
      description: "Sync orders, line items, fulfillments, and timeline events",
      icon: <ShoppingCart className="h-5 w-5 text-muted-foreground" />,
      status: checkAndLog("orders", "Orders", orders.isPending, false, false),
      progress: orders.progress,
      onSync: () => { setStatus("orders", "running"); orders.syncOrders(false); },
      secondaryAction: {
        label: "Full Sync",
        onClick: () => { setStatus("orders", "running"); orders.syncOrders(true); },
      },
    },
    {
      key: "customers", title: "Customers",
      description: "Sync all customer profiles from Shopify",
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
      status: checkAndLog("customers", "Customers", customers.isPending, customers.isSuccess, customers.isError),
      progress: (customers as any).progress,
      onSync: () => wrapSync("customers", "Customers", () => customers.mutate()),
    },
    {
      key: "abandonedCheckouts", title: "Abandoned Checkouts",
      description: "Sync abandoned checkout data for recovery analysis",
      icon: <ShoppingCart className="h-5 w-5 text-muted-foreground" />,
      status: checkAndLog("abandonedCheckouts", "Abandoned Checkouts", abandonedCheckouts.isPending, abandonedCheckouts.isSuccess, abandonedCheckouts.isError),
      progress: (abandonedCheckouts as any).progress,
      onSync: () => wrapSync("abandonedCheckouts", "Abandoned Checkouts", () => abandonedCheckouts.mutate()),
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.54fr] gap-6">
        {/* Left: Sync Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
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

        {/* Right: Sync History */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Sync History</CardTitle>
              </div>
              <CardDescription className="text-xs">Last 7 syncs this session</CardDescription>
            </CardHeader>
            <CardContent>
              {syncLog.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No syncs yet. Run a sync to see history here.
                </p>
              ) : (
                <div className="space-y-3">
                  {syncLog.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      {entry.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.title}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(entry.timestamp)}</p>
                      </div>
                      <Badge
                        variant={entry.status === "success" ? "secondary" : "destructive"}
                        className="text-xs shrink-0"
                      >
                        {entry.status === "success" ? "Done" : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recommended Sync Order</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Products & Variants</li>
                <li>Collections</li>
                <li>Product ↔ Collection Links</li>
                <li>Brands</li>
                <li>Orders & Customers</li>
                <li>Abandoned Checkouts</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SyncDashboard;

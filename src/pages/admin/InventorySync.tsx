import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Clock, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SyncLog {
  id: string;
  timestamp: Date;
  status: "success" | "error" | "running";
  stats: {
    productsProcessed: number;
    skusFound: number;
    updated: number;
    skipped: number;
    errors: number;
    pagesProcessed: number;
  };
  message?: string;
}

export default function InventorySync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [currentProgress, setCurrentProgress] = useState<{ page: number; updated: number } | null>(null);
  const { toast } = useToast();

  const addLog = (log: Omit<SyncLog, "id">) => {
    setSyncLogs((prev) => [{ ...log, id: crypto.randomUUID() }, ...prev]);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setCurrentProgress({ page: 1, updated: 0 });
    
    let currentPage = 1;
    let hasMore = true;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalSkusFound = 0;
    let totalProductsProcessed = 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to sync inventory");
      }

      while (hasMore) {
        setCurrentProgress({ page: currentPage, updated: totalUpdated });

        const response = await fetch(
          `https://fexafkqzpbzjcupvbfhe.supabase.co/functions/v1/sapo-sync-inventory`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ page: currentPage, batchSize: 50 }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Sync failed");
        }

        if (result.success) {
          totalUpdated += result.stats?.updated || 0;
          totalSkipped += result.stats?.skipped || 0;
          totalErrors += result.stats?.errors || 0;
          totalSkusFound += result.stats?.skusFound || 0;
          totalProductsProcessed += result.stats?.productsProcessed || 0;

          hasMore = result.hasMore;
          if (hasMore) {
            currentPage = result.nextPage;
          }
        } else {
          throw new Error(result.error || "Unknown error");
        }
      }

      addLog({
        timestamp: new Date(),
        status: "success",
        message: `Synced ${totalUpdated} variants`,
        stats: {
          productsProcessed: totalProductsProcessed,
          skusFound: totalSkusFound,
          updated: totalUpdated,
          skipped: totalSkipped,
          errors: totalErrors,
          pagesProcessed: currentPage,
        },
      });

      toast({
        title: "Sync completed",
        description: `Updated ${totalUpdated} variants from Sapo`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      addLog({
        timestamp: new Date(),
        status: "error",
        message: errorMessage,
        stats: {
          productsProcessed: totalProductsProcessed,
          skusFound: totalSkusFound,
          updated: totalUpdated,
          skipped: totalSkipped,
          errors: totalErrors + 1,
          pagesProcessed: currentPage,
        },
      });

      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setCurrentProgress(null);
    }
  };

  const getStatusIcon = (status: SyncLog["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: SyncLog["status"]) => {
    switch (status) {
      case "success":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "running":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Running</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Sync</h1>
          <p className="text-muted-foreground">
            Sync stock quantities from Sapo to your product variants by matching SKU codes
          </p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} size="lg">
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync Inventory"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Source</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Sapo POS</div>
            <p className="text-xs text-muted-foreground">Inventory management system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Method</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SKU Code</div>
            <p className="text-xs text-muted-foreground">Matches Sapo SKU → product_variants.sku</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncLogs.find((l) => l.status === "success")
                ? format(syncLogs.find((l) => l.status === "success")!.timestamp, "HH:mm")
                : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncLogs.find((l) => l.status === "success")
                ? format(syncLogs.find((l) => l.status === "success")!.timestamp, "dd/MM/yyyy")
                : "No sync history"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent synchronization logs for this session</CardDescription>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 && !currentProgress ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No sync logs yet</p>
              <p className="text-sm">Click "Sync Inventory" to start syncing from Sapo</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {currentProgress && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card border-blue-500/30">
                    <div className="mt-0.5">
                      <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Running</Badge>
                      </div>
                      <p className="text-sm">Syncing page {currentProgress.page}... ({currentProgress.updated} updated so far)</p>
                    </div>
                  </div>
                )}
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(log.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(log.timestamp, "HH:mm:ss")}
                        </span>
                      </div>
                      <p className="text-sm">{log.message}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Pages: {log.stats.pagesProcessed}</span>
                        <span>SKUs: {log.stats.skusFound}</span>
                        <span className="text-green-600">Updated: {log.stats.updated}</span>
                        <span>Skipped: {log.stats.skipped}</span>
                        {log.stats.errors > 0 && (
                          <span className="text-destructive">Errors: {log.stats.errors}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

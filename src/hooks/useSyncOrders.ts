import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSyncOrders = () => {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncOrders = async (fullSync = false) => {
    setProgress({ current: 0, total: 0 });

    let updatedAtMin: string | null = null;

    if (!fullSync) {
      const { data: mostRecentOrder } = await supabase
        .from("orders")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      updatedAtMin = mostRecentOrder?.updated_at || null;
    }

    let nextBatch: string | null = null;
    let totalSynced = 0;
    let totalItems = 0;
    let totalFulfillments = 0;
    let totalEvents = 0;
    let batchCount = 0;

    if (updatedAtMin && !fullSync) {
      console.log(`Continuing sync from: ${updatedAtMin}`);
      toast({
        title: "Incremental Sync",
        description: "Syncing new and updated orders...",
      });
    } else {
      console.log("Starting full sync of all orders...");
      toast({
        title: "Full Sync",
        description: "Syncing all orders from Shopify...",
      });
    }

    do {
      batchCount++;
      console.log(`Syncing orders batch ${batchCount}...`);

      const body: Record<string, unknown> = {};
      if (nextBatch) {
        body.continueFrom = nextBatch;
      } else if (updatedAtMin && !fullSync) {
        body.updatedAtMin = updatedAtMin;
      }

      const { data, error } = await supabase.functions.invoke("shopify-sync-orders-batch", {
        body,
      });

      if (error) {
        throw new Error(error.message || `Orders sync failed`);
      }

      if (data) {
        totalSynced += data.stats.syncedOrders;
        totalItems += data.stats.syncedItems;
        totalFulfillments += data.stats.syncedFulfillments || 0;
        totalEvents += data.stats.syncedEvents || 0;
        setProgress({ current: totalSynced, total: totalSynced });

        nextBatch = data.hasMore ? data.nextBatch : null;

        console.log(
          `Batch ${batchCount}: ${data.stats.syncedOrders} orders, ${data.stats.syncedItems} items, ${data.stats.syncedEvents || 0} events (Total: ${totalSynced} orders)`
        );
      }

      if (nextBatch) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } while (nextBatch);

    return { totalSynced, totalItems, totalFulfillments, totalEvents };
  };

  const mutation = useMutation({
    mutationFn: (fullSync: boolean = false) => syncOrders(fullSync),
    onSuccess: ({ totalSynced, totalItems, totalEvents }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-events"] });
      queryClient.invalidateQueries({ queryKey: ["order-fulfillments"] });
      toast({
        title: "Orders Sync Complete!",
        description:
          totalSynced > 0
            ? `Synced ${totalSynced} orders, ${totalItems} items, ${totalEvents} timeline events.`
            : "No new orders to sync.",
      });
      setProgress({ current: 0, total: 0 });
    },
    onError: (error) => {
      console.error("Orders sync error:", error);
      toast({
        title: "Orders Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setProgress({ current: 0, total: 0 });
    },
  });

  return {
    syncOrders: (fullSync = false) => mutation.mutate(fullSync),
    syncOrdersAsync: (fullSync = false) => mutation.mutateAsync(fullSync),
    isPending: mutation.isPending,
    progress,
  };
};

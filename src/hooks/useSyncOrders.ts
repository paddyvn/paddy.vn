import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_FUNCTIONS_BASE_URL =
  "https://fexafkqzpbzjcupvbfhe.supabase.co/functions/v1";
// Anon key is safe to ship to the client (it’s already used in browser requests)
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGFma3F6cGJ6amN1cHZiZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzU4NzksImV4cCI6MjA3OTk1MTg3OX0.4pGuz_-KaRXZkOf1-3FlOzLuSDMJRAReg9a88JpTuw4";

export const useSyncOrders = () => {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncOrders = async (fullSync = false) => {
    setProgress({ current: 0, total: 0 });

    // Ensure user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("You must be logged in to sync orders");
    }

    let updatedAtMin: string | null = null;
    
    if (!fullSync) {
      // Use updated_at to catch both new orders AND orders with status/fulfillment changes
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

      const body: any = {};
      if (nextBatch) {
        body.continueFrom = nextBatch;
      } else if (updatedAtMin && !fullSync) {
        body.updatedAtMin = updatedAtMin;
      }
      // For full sync, we don't send any date filters

      const response = await fetch(
        `${SUPABASE_FUNCTIONS_BASE_URL}/shopify-sync-orders-batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const msg =
          (result && (result.error || result.message)) ||
          `Orders sync failed (HTTP ${response.status})`;
        throw new Error(msg);
      }

      const data = result;

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
    isPending: mutation.isPending,
    progress,
  };
};


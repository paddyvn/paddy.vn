import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSyncOrders = () => {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      setProgress({ current: 0, total: 0 });
      
      const { data: mostRecentOrder } = await supabase
        .from('orders')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nextBatch: string | null = null;
      let createdAtMin: string | null = mostRecentOrder?.created_at || null;
      let totalSynced = 0;
      let totalItems = 0;
      let totalFulfillments = 0;
      let totalEvents = 0;
      let batchCount = 0;

      if (createdAtMin) {
        console.log(`Continuing sync from: ${createdAtMin}`);
        toast({
          title: "Incremental Sync",
          description: "Syncing only new orders since last sync...",
        });
      }

      do {
        batchCount++;
        console.log(`Syncing orders batch ${batchCount}...`);
        
        const body: any = {};
        if (nextBatch) {
          body.continueFrom = nextBatch;
        } else if (createdAtMin) {
          body.createdAtMin = createdAtMin;
        }

        const { data, error } = await supabase.functions.invoke('shopify-sync-orders-batch', {
          body,
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedOrders;
          totalItems += data.stats.syncedItems;
          totalFulfillments += data.stats.syncedFulfillments || 0;
          totalEvents += data.stats.syncedEvents || 0;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.nextBatch : null;
          
          console.log(`Batch ${batchCount}: ${data.stats.syncedOrders} orders, ${data.stats.syncedItems} items, ${data.stats.syncedEvents || 0} events (Total: ${totalSynced} orders)`);
        }

        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      return { totalSynced, totalItems, totalFulfillments, totalEvents };
    },
    onSuccess: ({ totalSynced, totalItems, totalEvents }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-events"] });
      queryClient.invalidateQueries({ queryKey: ["order-fulfillments"] });
      toast({
        title: "Orders Sync Complete!",
        description: totalSynced > 0 
          ? `Synced ${totalSynced} orders, ${totalItems} items, ${totalEvents} timeline events.`
          : "No new orders to sync.",
      });
      setProgress({ current: 0, total: 0 });
    },
    onError: (error) => {
      console.error('Orders sync error:', error);
      toast({
        title: "Orders Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setProgress({ current: 0, total: 0 });
    },
  });

  return {
    ...mutation,
    progress,
  };
};

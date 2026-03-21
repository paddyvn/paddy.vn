import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSyncCustomers = () => {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      setProgress({ current: 0, total: 0 });
      
      let nextBatch: string | null = null;
      let totalSynced = 0;
      let batchCount = 0;

      do {
        batchCount++;
        console.log(`Syncing customers batch ${batchCount}...`);
        
        const body: any = {};
        if (nextBatch) {
          body.continueFrom = nextBatch;
        } else if (batchCount === 1) {
          // Fix 6: Incremental sync — fetch only customers created after the most recent one
          const { data: latest } = await supabase
            .from('customers')
            .select('shopify_created_at')
            .order('shopify_created_at', { ascending: false })
            .limit(1)
            .single();

          if (latest?.shopify_created_at) {
            body.createdAtMin = latest.shopify_created_at;
            console.log(`Incremental sync from: ${latest.shopify_created_at}`);
          }
        }

        const { data, error } = await supabase.functions.invoke('shopify-sync-customers-batch', {
          body,
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedCustomers;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.nextBatch : null;
          
          console.log(`Batch ${batchCount}: ${data.stats.syncedCustomers} customers (Total: ${totalSynced})`);
        }

        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      return totalSynced;
    },
    onSuccess: (totalSynced) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Customers Sync Complete!",
        description: totalSynced > 0 
          ? `Successfully synced ${totalSynced} customers from Shopify.`
          : "No new customers to sync.",
      });
      setProgress({ current: 0, total: 0 });
    },
    onError: (error) => {
      console.error('Customers sync error:', error);
      toast({
        title: "Customers Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setProgress({ current: 0, total: 0 });
    },
  });
};

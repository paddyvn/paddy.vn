import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSyncProducts = () => {
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
        console.log(`Syncing batch ${batchCount}...`);
        
        const body: any = {};
        if (nextBatch) {
          body.continueFrom = nextBatch;
        } else if (batchCount === 1) {
          // Incremental sync: only fetch products updated since last sync
          const { data: latest } = await supabase
            .from('products')
            .select('source_updated_at')
            .order('source_updated_at', { ascending: false })
            .limit(1)
            .single();

          if (latest?.source_updated_at) {
            body.updatedAtMin = latest.source_updated_at;
            console.log(`Incremental sync from: ${latest.source_updated_at}`);
          }
        }

        const { data, error } = await supabase.functions.invoke('shopify-sync-batch', {
          body,
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedProducts;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.nextBatch : null;
          
          console.log(`Batch ${batchCount}: Synced ${data.stats.syncedProducts} products (Total: ${totalSynced})`);
        }

        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      return totalSynced;
    },
    onSuccess: (totalSynced) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: "Sync Complete!",
        description: `Successfully synced ${totalSynced} products from Shopify.`,
      });
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });
};

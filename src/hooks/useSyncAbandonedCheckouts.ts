import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSyncAbandonedCheckouts = () => {
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
        console.log(`Syncing abandoned checkouts batch ${batchCount}...`);
        
        const body: any = {};
        if (nextBatch) {
          body.continueFrom = nextBatch;
        }

        const { data, error } = await supabase.functions.invoke('shopify-sync-abandoned-checkouts', {
          body,
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedCheckouts;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.continueFrom : null;
          
          console.log(`Batch ${batchCount}: ${data.stats.syncedCheckouts} checkouts (Total: ${totalSynced})`);
        }

        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      return totalSynced;
    },
    onSuccess: (totalSynced) => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-checkouts"] });
      toast({
        title: "Abandoned Checkouts Sync Complete!",
        description: totalSynced > 0 
          ? `Successfully synced ${totalSynced} abandoned checkouts from Shopify.`
          : "No abandoned checkouts to sync.",
      });
      setProgress({ current: 0, total: 0 });
    },
    onError: (error) => {
      console.error('Abandoned checkouts sync error:', error);
      toast({
        title: "Abandoned Checkouts Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setProgress({ current: 0, total: 0 });
    },
  });
};

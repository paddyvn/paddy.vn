import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const ShopifySync = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const syncAllProducts = async () => {
    setSyncing(true);
    setProgress({ current: 0, total: 0 });
    
    try {
      let nextBatch: string | null = null;
      let totalSynced = 0;
      let batchCount = 0;

      do {
        batchCount++;
        console.log(`Syncing batch ${batchCount}...`);
        
        const { data, error } = await supabase.functions.invoke('shopify-sync-batch', {
          body: nextBatch ? { continueFrom: nextBatch } : {},
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedProducts;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.nextBatch : null;
          
          console.log(`Batch ${batchCount}: Synced ${data.stats.syncedProducts} products (Total: ${totalSynced})`);
        }

        // Small delay to avoid rate limits
        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      toast({
        title: "Sync Complete!",
        description: `Successfully synced ${totalSynced} products from Shopify.`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 border border-border rounded-lg bg-card">
      <div>
        <h3 className="text-lg font-semibold">Shopify Product Sync</h3>
        <p className="text-sm text-muted-foreground">
          Sync all products, variants, and images from your Shopify store.
        </p>
      </div>
      
      {syncing && progress.current > 0 && (
        <div className="text-sm text-muted-foreground">
          Synced {progress.current} products...
        </div>
      )}
      
      <Button 
        onClick={syncAllProducts} 
        disabled={syncing}
        className="w-full"
      >
        {syncing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          'Sync All Products'
        )}
      </Button>
    </div>
  );
};

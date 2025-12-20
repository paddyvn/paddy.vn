import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SyncProgress {
  updated: number;
  processed: number;
  errors: number;
  total: number;
}

export function SyncOptionNamesButton() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const { toast } = useToast();

  const syncOptionNames = async () => {
    setSyncing(true);
    
    try {
      // Get total count of products needing sync
      const { count: totalCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .not('source_id', 'is', null)
        .is('option1_name', null);

      const total = totalCount || 0;
      setProgress({ updated: 0, processed: 0, errors: 0, total });

      let totalUpdated = 0;
      let totalProcessed = 0;
      let totalErrors = 0;
      let hasMore = true;
      let nextBatch: string | null = null;

      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('shopify-sync-option-names', {
          body: { batchSize: 50, continueFrom: nextBatch }
        });

        if (error) throw error;

        totalUpdated += data.stats?.updatedProducts || 0;
        totalProcessed += data.stats?.totalProcessed || 0;
        totalErrors += data.stats?.errorCount || 0;
        hasMore = data.hasMore || false;
        nextBatch = data.nextBatch;

        setProgress({
          updated: totalUpdated,
          processed: totalProcessed,
          errors: totalErrors,
          total
        });
      }

      toast({
        title: "Option names synced",
        description: `Updated ${totalUpdated} products with option names from Shopify.`,
      });
    } catch (error: any) {
      console.error('Error syncing option names:', error);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync option names",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const progressPercent = progress && progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        onClick={syncOptionNames}
        disabled={syncing}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync Option Names"}
      </Button>
      
      {syncing && progress && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-3">
            <span>{progress.processed} / {progress.total}</span>
            <span className="text-primary">{progress.updated} updated</span>
            {progress.errors > 0 && (
              <span className="text-destructive">{progress.errors} errors</span>
            )}
          </div>
          <Progress value={progressPercent} className="h-1" />
        </div>
      )}
    </div>
  );
}

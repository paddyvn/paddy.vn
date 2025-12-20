import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function SyncOptionNamesButton() {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const syncOptionNames = async () => {
    setSyncing(true);
    try {
      let totalUpdated = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('shopify-sync-option-names', {
          body: { batchSize: 50 }
        });

        if (error) throw error;

        totalUpdated += data.updated || 0;
        hasMore = data.hasMore || false;

        if (hasMore) {
          toast({
            title: "Syncing...",
            description: `Updated ${totalUpdated} products so far...`,
          });
        }
      }

      toast({
        title: "Option names synced",
        description: `Successfully updated ${totalUpdated} products with option names from Shopify.`,
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

  return (
    <Button
      variant="outline"
      onClick={syncOptionNames}
      disabled={syncing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync Option Names"}
    </Button>
  );
}

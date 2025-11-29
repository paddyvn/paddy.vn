import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMigrateImages() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      let totalMigrated = 0;
      let hasMore = true;
      
      // Keep calling the function until all images are migrated
      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('migrate-images-to-storage', {
          body: { batchSize: 50 }
        });
        
        if (error) throw error;
        
        totalMigrated += data.stats.migrated;
        hasMore = data.hasMore;
        
        console.log(`Batch completed: ${data.stats.migrated} migrated, ${data.remaining} remaining`);
        
        // Show progress toast for each batch
        if (hasMore) {
          toast({
            title: "Migration in progress...",
            description: `Migrated ${totalMigrated} images so far. ${data.remaining} remaining.`,
          });
        }
      }
      
      return { totalMigrated };
    },
    onSuccess: (data) => {
      toast({
        title: "Migration completed!",
        description: `Successfully migrated ${data.totalMigrated} images to Supabase Storage.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Migration failed",
        description: error instanceof Error ? error.message : "Failed to migrate images",
        variant: "destructive",
      });
    },
  });
}

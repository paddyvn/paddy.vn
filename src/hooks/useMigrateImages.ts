import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";

export function useMigrateImages() {
  const { toast } = useToast();
  const isPausedRef = useRef(false);
  const [progress, setProgress] = useState({ migrated: 0, total: 0, percentage: 0 });

  const pause = () => {
    isPausedRef.current = true;
  };

  const resume = () => {
    isPausedRef.current = false;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      isPausedRef.current = false;
      let totalMigrated = 0;
      let hasMore = true;
      let totalImages = 0;
      
      // Keep calling the function until all images are migrated or paused
      while (hasMore && !isPausedRef.current) {
        const { data, error } = await supabase.functions.invoke('migrate-images-to-storage', {
          body: { batchSize: 50 }
        });
        
        if (error) throw error;
        
        totalMigrated += data.stats.migrated;
        hasMore = data.hasMore;
        
        // Calculate total and percentage
        if (totalImages === 0) {
          totalImages = totalMigrated + data.remaining;
        }
        const percentage = totalImages > 0 ? Math.round((totalMigrated / totalImages) * 100) : 0;
        
        // Update progress state
        setProgress({ migrated: totalMigrated, total: totalImages, percentage });
        
        console.log(`Batch completed: ${data.stats.migrated} migrated, ${data.remaining} remaining`);
        
        // Show progress toast for each batch
        if (hasMore) {
          toast({
            title: "Migration in progress...",
            description: `Migrated ${totalMigrated} of ${totalImages} images (${percentage}%)`,
          });
        }
      }
      
      if (isPausedRef.current) {
        toast({
          title: "Migration paused",
          description: `Migrated ${totalMigrated} images before pausing. Click Resume to continue.`,
        });
      }
      
      return { totalMigrated };
    },
    onSuccess: (data) => {
      if (!isPausedRef.current) {
        toast({
          title: "Migration completed!",
          description: `Successfully migrated ${data.totalMigrated} images to Supabase Storage.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Migration failed",
        description: error instanceof Error ? error.message : "Failed to migrate images",
        variant: "destructive",
      });
    },
  });

  return {
    ...mutation,
    pause,
    resume,
    progress,
  };
}

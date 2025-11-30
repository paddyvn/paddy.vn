import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState, useEffect } from "react";

export function useMigrateImages() {
  const { toast } = useToast();
  const isPausedRef = useRef(false);
  const [progress, setProgress] = useState({ migrated: 0, total: 0, percentage: 0 });

  // Fetch current migration status on mount
  const { data: migrationStatus } = useQuery({
    queryKey: ['migration-status'],
    queryFn: async () => {
      // Count total images
      const { count: totalCollections } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .not('image_url', 'is', null);
      
      const { count: totalProducts } = await supabase
        .from('product_images')
        .select('id', { count: 'exact', head: true });
      
      // Count migrated images (not from Shopify CDN)
      const { count: migratedCollections } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .not('image_url', 'is', null)
        .not('image_url', 'like', '%cdn.shopify.com%');
      
      const { count: migratedProducts } = await supabase
        .from('product_images')
        .select('id', { count: 'exact', head: true })
        .not('image_url', 'like', '%cdn.shopify.com%');
      
      const total = (totalCollections || 0) + (totalProducts || 0);
      const migrated = (migratedCollections || 0) + (migratedProducts || 0);
      const percentage = total > 0 ? Math.round((migrated / total) * 100) : 0;
      
      return { migrated, total, percentage };
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Update progress state when query data changes
  useEffect(() => {
    if (migrationStatus) {
      setProgress(migrationStatus);
    }
  }, [migrationStatus]);

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
          body: { batchSize: 25 } // Reduced batch size to prevent memory issues
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
        
        // Add small delay between batches to prevent overwhelming the system
        if (hasMore && !isPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
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

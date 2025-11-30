import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState, useEffect } from "react";

const MIGRATION_STATE_KEY = 'image-migration-state';

export function useMigrateImages() {
  const { toast } = useToast();
  const isPausedRef = useRef(false);
  const [progress, setProgress] = useState({ migrated: 0, total: 0, percentage: 0 });
  const [autoStarted, setAutoStarted] = useState(false);

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
      
      // Save progress to localStorage
      localStorage.setItem(MIGRATION_STATE_KEY, JSON.stringify({
        ...migrationStatus,
        lastUpdated: new Date().toISOString()
      }));
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
          body: { batchSize: 20 } // Reduced to prevent timeouts
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
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
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
        localStorage.removeItem(MIGRATION_STATE_KEY);
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

  // Auto-start migration if incomplete (after mutation is defined)
  useEffect(() => {
    if (!autoStarted && migrationStatus && migrationStatus.percentage < 100 && migrationStatus.percentage > 0) {
      const savedState = localStorage.getItem(MIGRATION_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const lastUpdated = new Date(parsed.lastUpdated);
        const now = new Date();
        const minutesSinceUpdate = (now.getTime() - lastUpdated.getTime()) / 1000 / 60;
        
        // Auto-continue if last update was less than 10 minutes ago
        if (minutesSinceUpdate < 10) {
          console.log('Auto-continuing migration from', migrationStatus.percentage, '%');
          setAutoStarted(true);
          setTimeout(() => mutation.mutate(), 2000);
        }
      }
    }
  }, [migrationStatus, autoStarted, mutation]);

  return {
    ...mutation,
    pause,
    resume,
    progress,
  };
}

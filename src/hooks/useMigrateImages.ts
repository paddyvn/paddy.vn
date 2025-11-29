import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMigrateImages() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('migrate-images-to-storage');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Images migrated successfully",
        description: `Migrated ${data.stats.migrated} images in ${data.stats.duration}`,
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

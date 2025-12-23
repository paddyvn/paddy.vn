import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSyncBrands = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('shopify-sync-brands');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast({
        title: "Brands Sync Complete!",
        description: `Synced ${data.stats.newBrands} new brands, updated ${data.stats.updatedBrands}.`,
      });
    },
    onError: (error) => {
      console.error('Brands sync error:', error);
      toast({
        title: "Brands Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });
};

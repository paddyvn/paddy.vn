import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSyncProductCollections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('shopify-sync-product-collections');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-collections"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product-Collection Sync Complete!",
        description: `Successfully synced ${data.stats.insertedCount} product-collection relationships.`,
      });
    },
    onError: (error) => {
      console.error('Product-collection sync error:', error);
      toast({
        title: "Product-Collection Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });
};

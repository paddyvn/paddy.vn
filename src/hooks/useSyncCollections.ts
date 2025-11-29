import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSyncCollections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('shopify-sync-collections');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      toast({
        title: "Collections Sync Complete!",
        description: `Successfully synced ${data.stats.syncedCollections} collections from Shopify.`,
      });
    },
    onError: (error) => {
      console.error('Collections sync error:', error);
      toast({
        title: "Collections Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });
};

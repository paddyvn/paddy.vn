import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Page {
  id: string;
  shopify_page_id: string | null;
  title: string;
  handle: string;
  body_html: string | null;
  author: string | null;
  published: boolean;
  template_suffix: string | null;
  created_at: string;
  updated_at: string;
  shopify_created_at: string | null;
  shopify_updated_at: string | null;
}

export const usePages = () => {
  return useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Page[];
    },
  });
};

export const useSyncPages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("shopify-sync-pages");

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({
        title: "Sync Complete",
        description: data.message || "Pages synced successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Page>;
    }) => {
      const { error } = await supabase
        .from("pages")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({
        title: "Page Updated",
        description: "Page has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeletePage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pages").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({
        title: "Page Deleted",
        description: "Page has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
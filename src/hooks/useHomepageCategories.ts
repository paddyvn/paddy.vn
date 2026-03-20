import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface HomepageCategory {
  id: string;
  pet_type: string;
  name: string;
  slug: string;
  icon: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useHomepageCategories = (petType: string) => {
  return useQuery({
    queryKey: ["admin-homepage-categories", petType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_categories")
        .select("*")
        .eq("pet_type", petType)
        .order("position");
      if (error) throw error;
      return data as HomepageCategory[];
    },
  });
};

export const useActiveHomepageCategories = (petType: string) => {
  return useQuery({
    queryKey: ["homepage-categories", petType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_categories")
        .select("name, slug, icon")
        .eq("pet_type", petType)
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data as { name: string; slug: string; icon: string }[];
    },
  });
};

export const useCreateHomepageCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: Omit<HomepageCategory, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("homepage_categories")
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-categories"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-categories"] });
      toast({ title: "Category created" });
    },
    onError: () => toast({ title: "Failed to create", variant: "destructive" }),
  });
};

export const useUpdateHomepageCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HomepageCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("homepage_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-categories"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-categories"] });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });
};

export const useDeleteHomepageCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("homepage_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-categories"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-categories"] });
      toast({ title: "Category deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });
};

export const useReorderHomepageCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; position: number }[]) => {
      const updates = items.map((item) =>
        supabase.from("homepage_categories").update({ position: item.position }).eq("id", item.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-categories"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-categories"] });
    },
  });
};

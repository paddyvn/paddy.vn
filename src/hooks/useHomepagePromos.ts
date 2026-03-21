import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomepagePromo {
  id: string;
  title: string;
  eyebrow: string | null;
  cta_text: string;
  image_url: string | null;
  bg_color: string;
  layout_slot: string;
  link_url: string | null;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

type HomepagePromoInsert = Omit<HomepagePromo, "id" | "created_at" | "updated_at">;
type HomepagePromoUpdate = Partial<HomepagePromoInsert> & { id: string };

const KEYS = {
  admin: ["admin-homepage-promos"],
  storefront: ["homepage-promos"],
};

export const useHomepagePromos = () =>
  useQuery({
    queryKey: KEYS.admin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_promos")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as HomepagePromo[];
    },
  });

export const useActiveHomepagePromos = () =>
  useQuery({
    queryKey: KEYS.storefront,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_promos")
        .select("*")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data as HomepagePromo[];
    },
  });

export const useCreateHomepagePromo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (promo: Omit<HomepagePromoInsert, "is_active"> & { is_active?: boolean }) => {
      const { data, error } = await supabase
        .from("homepage_promos")
        .insert(promo)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.admin });
      qc.invalidateQueries({ queryKey: KEYS.storefront });
    },
  });
};

export const useUpdateHomepagePromo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: HomepagePromoUpdate) => {
      const { data, error } = await supabase
        .from("homepage_promos")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.admin });
      qc.invalidateQueries({ queryKey: KEYS.storefront });
    },
  });
};

export const useDeleteHomepagePromo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("homepage_promos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.admin });
      qc.invalidateQueries({ queryKey: KEYS.storefront });
    },
  });
};

export const useReorderHomepagePromos = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; position: number }[]) => {
      const promises = items.map(({ id, position }) =>
        supabase.from("homepage_promos").update({ position }).eq("id", id)
      );
      const results = await Promise.all(promises);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.admin });
      qc.invalidateQueries({ queryKey: KEYS.storefront });
    },
  });
};

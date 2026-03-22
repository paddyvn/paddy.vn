import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BannerType = 'hero' | 'announcement' | 'promotional';

export interface Banner {
  id: string;
  type: BannerType;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  badge_text: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string | null;
  text_color: string | null;
  display_order: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export type BannerInsert = Omit<Banner, 'id' | 'created_at' | 'updated_at'>;
export type BannerUpdate = Partial<BannerInsert>;

export const useBanners = (type?: BannerType) => {
  return useQuery({
    queryKey: ["banners", type],
    queryFn: async () => {
      let query = supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Banner[];
    },
  });
};

export const useActiveBanners = (type: BannerType) => {
  return useQuery({
    queryKey: ["banners", "active", type],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("type", type)
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: BannerInsert) => {
      const { data, error } = await supabase
        .from("banners")
        .insert(banner)
        .select()
        .single();

      if (error) throw error;
      return data as Banner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: BannerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Banner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useReorderBanners = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banners: { id: string; display_order: number }[]) => {
      const updates = banners.map((banner) =>
        supabase
          .from("banners")
          .update({ display_order: banner.display_order })
          .eq("id", banner.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const uploadBannerImage = async (file: File, folder: string = "hero"): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.${fileExt}`;

  const { data, error: uploadError } = await supabase.storage
    .from("banners")
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("banners").getPublicUrl(data.path);
  return urlData.publicUrl;
};

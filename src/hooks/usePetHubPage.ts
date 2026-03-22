import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PetHubPage {
  id: string;
  pet_type: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
  hero_cta_text: string | null;
  hero_cta_link: string | null;
  meta_title: string | null;
  meta_description: string | null;
  seo_heading: string | null;
  seo_body_html: string | null;
  seo_faq: { question: string; answer: string }[] | null;
  is_active: boolean;
}

export const usePetHubPage = (petType: "dog" | "cat") => {
  return useQuery({
    queryKey: ["pet-hub-page", petType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_hub_pages")
        .select("*")
        .eq("pet_type", petType)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as PetHubPage | null;
    },
    staleTime: 5 * 60 * 1000,
  });
};

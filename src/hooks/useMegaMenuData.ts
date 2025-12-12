import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NavigationItem {
  id: string;
  label: string;
  link: string;
  display_order: number;
}

interface NavigationColumn {
  id: string;
  title: string;
  shop_all_link: string | null;
  display_order: number;
  items: NavigationItem[];
}

interface NavigationMenuData {
  id: string;
  name: string;
  slug: string;
  promo_image_url: string | null;
  promo_title: string | null;
  promo_badge: string | null;
  promo_link: string | null;
  columns: NavigationColumn[];
}

export function useMegaMenuData(slug: string | null) {
  return useQuery({
    queryKey: ["mega-menu", slug],
    queryFn: async () => {
      if (!slug) return null;

      // Fetch menu by slug
      const { data: menu, error: menuError } = await supabase
        .from("navigation_menus")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (menuError) throw menuError;
      if (!menu) return null;

      // Fetch columns for this menu
      const { data: columns, error: columnsError } = await supabase
        .from("navigation_columns")
        .select("*")
        .eq("menu_id", menu.id)
        .order("display_order");

      if (columnsError) throw columnsError;

      // Fetch items for all columns
      const columnIds = (columns || []).map((c) => c.id);
      const { data: items, error: itemsError } = await supabase
        .from("navigation_items")
        .select("*")
        .in("column_id", columnIds)
        .order("display_order");

      if (itemsError) throw itemsError;

      // Assemble the menu data
      const result: NavigationMenuData = {
        ...menu,
        columns: (columns || []).map((col) => ({
          ...col,
          items: (items || []).filter((item) => item.column_id === col.id),
        })),
      };

      return result;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

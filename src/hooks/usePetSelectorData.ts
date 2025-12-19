import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PetSelectorItem {
  id: string;
  label: string;
  link: string;
  display_order: number;
}

interface PetSelectorBlock {
  id: string;
  title: string;
  link: string | null;
  icon_type: string | null;
  background_color: string | null;
  group_type: string | null;
  display_order: number;
  items: PetSelectorItem[];
}

interface PetSelectorData {
  id: string;
  dogBlocks: PetSelectorBlock[];
  catBlocks: PetSelectorBlock[];
}

export function usePetSelectorData() {
  return useQuery({
    queryKey: ["pet-selector"],
    queryFn: async () => {
      // Fetch menu by slug
      const { data: menu, error: menuError } = await supabase
        .from("navigation_menus")
        .select("*")
        .eq("slug", "pet-selector")
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
      let items: any[] = [];
      
      if (columnIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("navigation_items")
          .select("*")
          .in("column_id", columnIds)
          .order("display_order");

        if (itemsError) throw itemsError;
        items = itemsData || [];
      }

      // Assemble blocks with their items
      const blocks: PetSelectorBlock[] = (columns || []).map((col) => ({
        id: col.id,
        title: col.title,
        link: col.shop_all_link,
        icon_type: col.icon_type,
        background_color: col.background_color,
        group_type: col.group_type,
        display_order: col.display_order,
        items: items.filter((item) => item.column_id === col.id),
      }));

      // Split into dog and cat groups
      const dogBlocks = blocks.filter(b => b.group_type === 'dog');
      const catBlocks = blocks.filter(b => b.group_type === 'cat');

      return {
        id: menu.id,
        dogBlocks,
        catBlocks,
      } as PetSelectorData;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FooterMenuItem {
  id: string;
  label: string;
  link: string;
  display_order: number;
}

interface FooterMenu {
  id: string;
  name: string;
  slug: string;
  items: FooterMenuItem[];
}

export function useFooterMenus() {
  return useQuery({
    queryKey: ["footer-menus"],
    queryFn: async () => {
      const slugs = ["footer-ve-paddy", "footer-shop", "footer-ho-tro", "footer-social"];

      const { data: menus, error: menusError } = await supabase
        .from("navigation_menus")
        .select("*")
        .in("slug", slugs)
        .eq("is_active", true)
        .order("display_order");

      if (menusError) throw menusError;
      if (!menus?.length) return [] as FooterMenu[];

      const { data: columns, error: colError } = await supabase
        .from("navigation_columns")
        .select("*")
        .in("menu_id", menus.map((m) => m.id));

      if (colError) throw colError;

      const columnIds = (columns || []).map((c) => c.id);
      if (!columnIds.length) return menus.map((m) => ({ ...m, items: [] })) as FooterMenu[];

      const { data: items, error: itemsError } = await supabase
        .from("navigation_items")
        .select("*")
        .in("column_id", columnIds)
        .order("display_order");

      if (itemsError) throw itemsError;

      return menus.map((menu) => {
        const menuColumns = (columns || []).filter((c) => c.menu_id === menu.id);
        const menuColumnIds = menuColumns.map((c) => c.id);
        return {
          id: menu.id,
          name: menu.name,
          slug: menu.slug,
          items: (items || []).filter((i) => menuColumnIds.includes(i.column_id)),
        } as FooterMenu;
      });
    },
    staleTime: 10 * 60 * 1000,
  });
}

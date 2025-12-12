import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NavigationItem {
  id: string;
  column_id: string;
  label: string;
  link: string;
  display_order: number;
}

export interface NavigationColumn {
  id: string;
  menu_id: string;
  title: string;
  shop_all_link: string | null;
  display_order: number;
  items: NavigationItem[];
}

export interface NavigationMenu {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  display_order: number;
  promo_image_url: string | null;
  promo_title: string | null;
  promo_badge: string | null;
  promo_link: string | null;
  columns: NavigationColumn[];
}

export function useNavigationMenus() {
  return useQuery({
    queryKey: ["navigation-menus"],
    queryFn: async () => {
      // Fetch menus
      const { data: menus, error: menusError } = await supabase
        .from("navigation_menus")
        .select("*")
        .order("display_order");

      if (menusError) throw menusError;

      // Fetch columns
      const { data: columns, error: columnsError } = await supabase
        .from("navigation_columns")
        .select("*")
        .order("display_order");

      if (columnsError) throw columnsError;

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from("navigation_items")
        .select("*")
        .order("display_order");

      if (itemsError) throw itemsError;

      // Nest the data
      const result: NavigationMenu[] = (menus || []).map((menu) => ({
        ...menu,
        columns: (columns || [])
          .filter((col) => col.menu_id === menu.id)
          .map((col) => ({
            ...col,
            items: (items || []).filter((item) => item.column_id === col.id),
          })),
      }));

      return result;
    },
  });
}

export function useNavigationMenu(menuId: string | undefined) {
  return useQuery({
    queryKey: ["navigation-menu", menuId],
    queryFn: async () => {
      if (!menuId) return null;

      const { data: menu, error: menuError } = await supabase
        .from("navigation_menus")
        .select("*")
        .eq("id", menuId)
        .maybeSingle();

      if (menuError) throw menuError;
      if (!menu) return null;

      const { data: columns, error: columnsError } = await supabase
        .from("navigation_columns")
        .select("*")
        .eq("menu_id", menuId)
        .order("display_order");

      if (columnsError) throw columnsError;

      const { data: items, error: itemsError } = await supabase
        .from("navigation_items")
        .select("*")
        .in("column_id", (columns || []).map((c) => c.id))
        .order("display_order");

      if (itemsError) throw itemsError;

      const result: NavigationMenu = {
        ...menu,
        columns: (columns || []).map((col) => ({
          ...col,
          items: (items || []).filter((item) => item.column_id === col.id),
        })),
      };

      return result;
    },
    enabled: !!menuId,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const { data: menu, error } = await supabase
        .from("navigation_menus")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return menu;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      toast.success("Menu created");
    },
    onError: (error) => {
      toast.error("Failed to create menu: " + error.message);
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<NavigationMenu> & { id: string }) => {
      const { error } = await supabase
        .from("navigation_menus")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-menu", variables.id] });
      toast.success("Menu updated");
    },
    onError: (error) => {
      toast.error("Failed to update menu: " + error.message);
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("navigation_menus")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      toast.success("Menu deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete menu: " + error.message);
    },
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { menu_id: string; title: string; shop_all_link?: string }) => {
      const { data: column, error } = await supabase
        .from("navigation_columns")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return column;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-menu", variables.menu_id] });
      toast.success("Column added");
    },
    onError: (error) => {
      toast.error("Failed to add column: " + error.message);
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      menu_id,
      ...data
    }: { id: string; menu_id: string; title?: string; shop_all_link?: string; display_order?: number }) => {
      const { error } = await supabase
        .from("navigation_columns")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      return menu_id;
    },
    onSuccess: (menu_id) => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-menu", menu_id] });
    },
    onError: (error) => {
      toast.error("Failed to update column: " + error.message);
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, menu_id }: { id: string; menu_id: string }) => {
      const { error } = await supabase
        .from("navigation_columns")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return menu_id;
    },
    onSuccess: (menu_id) => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-menu", menu_id] });
      toast.success("Column deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete column: " + error.message);
    },
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { column_id: string; label: string; link: string; menu_id: string }) => {
      const { menu_id, ...insertData } = data;
      const { data: item, error } = await supabase
        .from("navigation_items")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { item, menu_id };
    },
    onSuccess: ({ menu_id }) => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-menu", menu_id] });
      toast.success("Item added");
    },
    onError: (error) => {
      toast.error("Failed to add item: " + error.message);
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      menu_id,
      ...data
    }: { id: string; menu_id: string; label?: string; link?: string; display_order?: number }) => {
      const { error } = await supabase
        .from("navigation_items")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      return menu_id;
    },
    onSuccess: (menu_id) => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-menu", menu_id] });
    },
    onError: (error) => {
      toast.error("Failed to update item: " + error.message);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, menu_id }: { id: string; menu_id: string }) => {
      const { error } = await supabase
        .from("navigation_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return menu_id;
    },
    onSuccess: (menu_id) => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-menu", menu_id] });
      toast.success("Item deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete item: " + error.message);
    },
  });
}

export function useBulkUpdateColumnOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ menu_id, columns }: { menu_id: string; columns: { id: string; display_order: number }[] }) => {
      for (const col of columns) {
        const { error } = await supabase
          .from("navigation_columns")
          .update({ display_order: col.display_order })
          .eq("id", col.id);
        if (error) throw error;
      }
      return menu_id;
    },
    onSuccess: (menu_id) => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-menu", menu_id] });
    },
  });
}

export function useBulkUpdateItemOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ menu_id, items }: { menu_id: string; items: { id: string; display_order: number; column_id: string }[] }) => {
      for (const item of items) {
        const { error } = await supabase
          .from("navigation_items")
          .update({ display_order: item.display_order, column_id: item.column_id })
          .eq("id", item.id);
        if (error) throw error;
      }
      return menu_id;
    },
    onSuccess: (menu_id) => {
      queryClient.invalidateQueries({ queryKey: ["navigation-menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-menu", menu_id] });
    },
  });
}

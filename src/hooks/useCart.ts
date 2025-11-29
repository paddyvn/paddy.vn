import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCart = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["cart", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          products (
            name,
            slug,
            base_price,
            product_images (image_url, is_primary)
          ),
          product_variants (
            name,
            price
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const addToCart = useMutation({
    mutationFn: async ({
      productId,
      variantId,
      quantity = 1,
    }: {
      productId: string;
      variantId?: string;
      quantity?: number;
    }) => {
      if (!userId) throw new Error("User must be logged in");

      const { data, error } = await supabase
        .from("cart_items")
        .upsert(
          {
            user_id: userId,
            product_id: productId,
            variant_id: variantId || null,
            quantity,
          },
          {
            onConflict: "user_id,product_id,variant_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (cartItemId: string) => {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      toast({
        title: "Removed from cart",
        description: "Product has been removed from your cart",
      });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({
      cartItemId,
      quantity,
    }: {
      cartItemId: string;
      quantity: number;
    }) => {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", cartItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
    },
  });

  return {
    cart: cartQuery.data || [],
    isLoading: cartQuery.isLoading,
    addToCart: addToCart.mutate,
    removeFromCart: removeFromCart.mutate,
    updateQuantity: updateQuantity.mutate,
  };
};
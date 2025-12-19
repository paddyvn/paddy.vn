import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const GUEST_CART_KEY = "guest_cart";

interface GuestCartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
}

interface CartProduct {
  name: string;
  slug: string;
  base_price: number;
  product_images: { image_url: string; is_primary: boolean }[];
}

interface CartVariant {
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  products?: CartProduct | null;
  product_variants?: CartVariant | null;
}

// Helper functions outside of component
const getGuestCart = (): GuestCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveGuestCart = (cart: GuestCartItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

const clearGuestCart = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);
};

export const useCart = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [guestCartWithProducts, setGuestCartWithProducts] = useState<CartItem[]>([]);
  const [hasSynced, setHasSynced] = useState(false);

  // Load guest cart from localStorage on mount (only for guests)
  useEffect(() => {
    if (!userId) {
      const stored = getGuestCart();
      setGuestCart(stored);
    }
  }, [userId]);

  // Fetch product details for guest cart items
  useEffect(() => {
    if (userId || guestCart.length === 0) {
      setGuestCartWithProducts([]);
      return;
    }

    const fetchProducts = async () => {
      const productIds = [...new Set(guestCart.map((item) => item.product_id))];
      const variantIds = guestCart
        .map((item) => item.variant_id)
        .filter((id): id is string => id !== null);

      try {
        const [productsResult, variantsResult] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, slug, base_price, product_images(image_url, is_primary)")
            .in("id", productIds),
          variantIds.length > 0
            ? supabase.from("product_variants").select("id, name, price").in("id", variantIds)
            : Promise.resolve({ data: [] }),
        ]);

        const productsMap = new Map((productsResult.data || []).map((p) => [p.id, p]));
        const variantsMap = new Map((variantsResult.data || []).map((v) => [v.id, v]));

        const enriched: CartItem[] = guestCart.map((item) => ({
          ...item,
          products: productsMap.get(item.product_id) || null,
          product_variants: item.variant_id ? variantsMap.get(item.variant_id) || null : null,
        }));

        setGuestCartWithProducts(enriched);
      } catch (error) {
        console.error("Failed to fetch guest cart products:", error);
      }
    };

    fetchProducts();
  }, [guestCart, userId]);

  // Sync guest cart to DB when user logs in
  useEffect(() => {
    if (!userId || hasSynced) return;

    const syncCart = async () => {
      const storedGuestCart = getGuestCart();
      if (storedGuestCart.length === 0) {
        setHasSynced(true);
        return;
      }

      try {
        for (const item of storedGuestCart) {
          await supabase.from("cart_items").upsert(
            {
              user_id: userId,
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
            },
            { onConflict: "user_id,product_id,variant_id" }
          );
        }

        clearGuestCart();
        setGuestCart([]);
        queryClient.invalidateQueries({ queryKey: ["cart", userId] });

        toast({
          title: "Cart synced",
          description: "Your cart items have been saved to your account",
        });
      } catch (error) {
        console.error("Failed to sync cart:", error);
      }

      setHasSynced(true);
    };

    syncCart();
  }, [userId, hasSynced, queryClient, toast]);

  // Fetch DB cart for logged-in users
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
      return (data || []) as CartItem[];
    },
    enabled: !!userId,
  });

  // Add to cart mutation
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
      if (userId) {
        const { data, error } = await supabase
          .from("cart_items")
          .upsert(
            {
              user_id: userId,
              product_id: productId,
              variant_id: variantId || null,
              quantity,
            },
            { onConflict: "user_id,product_id,variant_id" }
          )
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const currentCart = getGuestCart();
        const existingIndex = currentCart.findIndex(
          (item) => item.product_id === productId && item.variant_id === (variantId || null)
        );

        if (existingIndex >= 0) {
          currentCart[existingIndex].quantity += quantity;
        } else {
          currentCart.push({
            id: crypto.randomUUID(),
            product_id: productId,
            variant_id: variantId || null,
            quantity,
            created_at: new Date().toISOString(),
          });
        }

        saveGuestCart(currentCart);
        setGuestCart([...currentCart]);
        return currentCart;
      }
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      }
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

  // Remove from cart mutation
  const removeFromCart = useMutation({
    mutationFn: async (cartItemId: string) => {
      if (userId) {
        const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
        if (error) throw error;
      } else {
        const currentCart = getGuestCart().filter((item) => item.id !== cartItemId);
        saveGuestCart(currentCart);
        setGuestCart([...currentCart]);
      }
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      }
      toast({
        title: "Removed from cart",
        description: "Product has been removed from your cart",
      });
    },
  });

  // Update quantity mutation
  const updateQuantity = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      if (userId) {
        const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);
        if (error) throw error;
      } else {
        const currentCart = getGuestCart();
        const index = currentCart.findIndex((item) => item.id === cartItemId);
        if (index >= 0) {
          currentCart[index].quantity = quantity;
          saveGuestCart(currentCart);
          setGuestCart([...currentCart]);
        }
      }
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      }
    },
  });

  const cart = userId ? cartQuery.data || [] : guestCartWithProducts;
  const isLoading = userId ? cartQuery.isLoading : false;

  return {
    cart,
    isLoading,
    addToCart: addToCart.mutate,
    removeFromCart: removeFromCart.mutate,
    updateQuantity: updateQuantity.mutate,
    isGuest: !userId,
  };
};

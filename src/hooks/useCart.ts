import { useEffect, useState, useCallback } from "react";
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

// Get guest cart from localStorage
const getGuestCart = (): GuestCartItem[] => {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save guest cart to localStorage
const saveGuestCart = (cart: GuestCartItem[]) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

// Clear guest cart from localStorage
const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export const useCart = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [guestCartWithProducts, setGuestCartWithProducts] = useState<CartItem[]>([]);

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (!userId) {
      setGuestCart(getGuestCart());
    }
  }, [userId]);

  // Fetch product details for guest cart items
  useEffect(() => {
    const fetchGuestCartProducts = async () => {
      if (userId || guestCart.length === 0) {
        setGuestCartWithProducts([]);
        return;
      }

      const productIds = [...new Set(guestCart.map((item) => item.product_id))];
      const variantIds = guestCart
        .map((item) => item.variant_id)
        .filter(Boolean) as string[];

      const [productsResult, variantsResult] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, slug, base_price, product_images(image_url, is_primary)")
          .in("id", productIds),
        variantIds.length > 0
          ? supabase
              .from("product_variants")
              .select("id, name, price")
              .in("id", variantIds)
          : Promise.resolve({ data: [] }),
      ]);

      const productsMap = new Map(
        (productsResult.data || []).map((p) => [p.id, p])
      );
      const variantsMap = new Map(
        (variantsResult.data || []).map((v) => [v.id, v])
      );

      const enrichedCart: CartItem[] = guestCart.map((item) => ({
        ...item,
        products: productsMap.get(item.product_id) || null,
        product_variants: item.variant_id
          ? variantsMap.get(item.variant_id) || null
          : null,
      }));

      setGuestCartWithProducts(enrichedCart);
    };

    fetchGuestCartProducts();
  }, [guestCart, userId]);

  // Sync guest cart to DB when user logs in
  useEffect(() => {
    const syncGuestCartToDb = async () => {
      if (!userId) return;

      const storedGuestCart = getGuestCart();
      if (storedGuestCart.length === 0) return;

      // Merge guest cart with existing user cart
      for (const item of storedGuestCart) {
        try {
          await supabase.from("cart_items").upsert(
            {
              user_id: userId,
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
            },
            {
              onConflict: "user_id,product_id,variant_id",
            }
          );
        } catch (error) {
          console.error("Failed to sync cart item:", error);
        }
      }

      // Clear guest cart after syncing
      clearGuestCart();
      setGuestCart([]);

      // Refresh the DB cart
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });

      toast({
        title: "Cart synced",
        description: "Your cart items have been saved to your account",
      });
    };

    syncGuestCartToDb();
  }, [userId, queryClient, toast]);

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

  // Add to cart (supports both guest and logged-in users)
  const addToCartFn = useCallback(
    async ({
      productId,
      variantId,
      quantity = 1,
    }: {
      productId: string;
      variantId?: string;
      quantity?: number;
    }) => {
      if (userId) {
        // Logged-in user: save to DB
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
      } else {
        // Guest user: save to localStorage
        const currentCart = getGuestCart();
        const existingIndex = currentCart.findIndex(
          (item) =>
            item.product_id === productId &&
            item.variant_id === (variantId || null)
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
    [userId]
  );

  const addToCart = useMutation({
    mutationFn: addToCartFn,
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

  // Remove from cart
  const removeFromCartFn = useCallback(
    async (cartItemId: string) => {
      if (userId) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", cartItemId);

        if (error) throw error;
      } else {
        const currentCart = getGuestCart().filter(
          (item) => item.id !== cartItemId
        );
        saveGuestCart(currentCart);
        setGuestCart([...currentCart]);
      }
    },
    [userId]
  );

  const removeFromCart = useMutation({
    mutationFn: removeFromCartFn,
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

  // Update quantity
  const updateQuantityFn = useCallback(
    async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      if (userId) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", cartItemId);

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
    [userId]
  );

  const updateQuantity = useMutation({
    mutationFn: updateQuantityFn,
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      }
    },
  });

  // Return the appropriate cart data
  const cart = userId ? (cartQuery.data || []) : guestCartWithProducts;
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

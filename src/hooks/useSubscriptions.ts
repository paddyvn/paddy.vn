import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, addWeeks } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

export type SubscriptionFrequency = "weekly" | "bi-weekly" | "monthly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  discount_percent: number;
  next_delivery_date: string;
  last_order_id: string | null;
  shipping_address: Json;
  delivery_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  created_at: string;
}

export interface CreateSubscriptionInput {
  user_id: string;
  frequency: SubscriptionFrequency;
  discount_percent: number;
  shipping_address: Json;
  delivery_method?: string;
  items: {
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    price: number;
  }[];
}

function calculateNextDeliveryDate(frequency: SubscriptionFrequency): string {
  const today = new Date();
  let nextDate: Date;

  switch (frequency) {
    case "weekly":
      nextDate = addWeeks(today, 1);
      break;
    case "bi-weekly":
      nextDate = addWeeks(today, 2);
      break;
    case "monthly":
    default:
      nextDate = addDays(today, 30);
      break;
  }

  return nextDate.toISOString().split("T")[0];
}

export function useSubscriptions(userId?: string) {
  return useQuery({
    queryKey: ["subscriptions", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          subscription_items (
            *,
            products:product_id (
              id,
              name,
              slug,
              product_images (image_url, is_primary)
            ),
            product_variants:variant_id (
              id,
              name,
              price
            )
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Subscription & { subscription_items: SubscriptionItem[] })[];
    },
    enabled: !!userId,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSubscriptionInput) => {
      const nextDeliveryDate = calculateNextDeliveryDate(input.frequency);

      // Create subscription
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert([{
          user_id: input.user_id,
          frequency: input.frequency,
          discount_percent: input.discount_percent,
          next_delivery_date: nextDeliveryDate,
          shipping_address: input.shipping_address,
          delivery_method: input.delivery_method,
        }])
        .select()
        .single();

      if (subError) throw subError;

      // Create subscription items
      const items = input.items.map((item) => ({
        subscription_id: subscription.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("subscription_items")
        .insert(items);

      if (itemsError) throw itemsError;

      return subscription;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", variables.user_id] });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      updates,
    }: {
      subscriptionId: string;
      updates: {
        status?: SubscriptionStatus;
        frequency?: SubscriptionFrequency;
        shipping_address?: Json;
        delivery_method?: string;
      };
    }) => {
      // If frequency changed, recalculate next delivery date
      const updateData: { 
        status?: string; 
        frequency?: string; 
        shipping_address?: Json; 
        delivery_method?: string;
        next_delivery_date?: string;
      } = { ...updates };
      
      if (updates.frequency) {
        updateData.next_delivery_date = calculateNextDeliveryDate(updates.frequency);
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("id", subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function usePauseSubscription() {
  const updateSubscription = useUpdateSubscription();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      return updateSubscription.mutateAsync({
        subscriptionId,
        updates: { status: "paused" },
      });
    },
  });
}

export function useResumeSubscription() {
  const updateSubscription = useUpdateSubscription();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      return updateSubscription.mutateAsync({
        subscriptionId,
        updates: { status: "active" },
      });
    },
  });
}

export function useCancelSubscription() {
  const updateSubscription = useUpdateSubscription();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      return updateSubscription.mutateAsync({
        subscriptionId,
        updates: { status: "cancelled" },
      });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Voucher {
  id: string;
  title: string;
  subtitle: string | null;
  gradient_from: string | null;
  gradient_to: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  display_order: number | null;
}

export const useActiveVouchers = () => {
  return useQuery({
    queryKey: ["active-vouchers"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("program_kind", "voucher")
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("display_order", { ascending: true })
        .limit(6);

      if (error) throw error;
      return data as Voucher[];
    },
  });
};

export const useUserSavedVouchers = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-saved-vouchers", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_saved_vouchers")
        .select("promotion_id")
        .eq("user_id", userId!);

      if (error) throw error;
      return data.map((d) => d.promotion_id);
    },
  });
};

export const useSaveVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, promotionId }: { userId: string; promotionId: string }) => {
      const { error } = await supabase
        .from("user_saved_vouchers")
        .insert({ user_id: userId, promotion_id: promotionId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-saved-vouchers"] });
      toast.success("Đã lưu voucher!");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.info("Bạn đã lưu voucher này rồi");
      } else {
        toast.error("Không thể lưu voucher");
      }
    },
  });
};

export const useVoucherSaveCount = (promotionId: string) => {
  return useQuery({
    queryKey: ["voucher-save-count", promotionId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_saved_vouchers")
        .select("*", { count: "exact", head: true })
        .eq("promotion_id", promotionId);

      if (error) throw error;
      return count || 0;
    },
  });
};

import { supabase } from "@/integrations/supabase/client";

export interface VoucherValidationResult {
  valid: boolean;
  error?: string;
  voucher?: {
    id: string;
    voucher_code: string;
    discount_type: string;
    discount_value: number;
    max_discount: number | null;
    min_order_value: number | null;
  };
}

export async function validateVoucher(
  code: string,
  subtotal: number
): Promise<VoucherValidationResult> {
  const { data, error } = await supabase
    .from("promotions")
    .select("id, voucher_code, discount_type, discount_value, max_discount, min_order_value, usage_limit, used_count, start_date, end_date")
    .eq("voucher_code", code.trim().toUpperCase())
    .eq("program_kind", "voucher")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: "Mã giảm giá không tồn tại hoặc đã hết hạn." };
  }

  if (data.start_date && new Date(data.start_date) > new Date()) {
    return { valid: false, error: "Mã giảm giá chưa có hiệu lực." };
  }

  if (data.end_date && new Date(data.end_date) < new Date()) {
    return { valid: false, error: "Mã giảm giá đã hết hạn." };
  }

  if (data.min_order_value && subtotal < data.min_order_value) {
    return {
      valid: false,
      error: `Đơn hàng tối thiểu ${data.min_order_value.toLocaleString("vi-VN")}₫ để sử dụng mã này.`,
    };
  }

  if (data.usage_limit && (data.used_count ?? 0) >= data.usage_limit) {
    return { valid: false, error: "Mã giảm giá đã hết lượt sử dụng." };
  }

  return {
    valid: true,
    voucher: {
      id: data.id,
      voucher_code: data.voucher_code!,
      discount_type: data.discount_type!,
      discount_value: data.discount_value!,
      max_discount: data.max_discount,
      min_order_value: data.min_order_value,
    },
  };
}

export function calculateVoucherDiscount(
  discountType: string,
  discountValue: number,
  maxDiscount: number | null,
  subtotal: number
): number {
  let amount = 0;
  if (discountType === "percentage") {
    amount = (subtotal * discountValue) / 100;
    if (maxDiscount && amount > maxDiscount) {
      amount = maxDiscount;
    }
  } else {
    amount = discountValue;
  }
  return Math.min(amount, subtotal);
}

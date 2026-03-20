import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Vietnamese mobile = 9 digits. Strip country code (84) or leading 0.
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  return digits;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderNumber, phone } = await req.json();

    if (!orderNumber || !phone) {
      return new Response(
        JSON.stringify({ error: "Vui lòng nhập mã đơn hàng và số điện thoại." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inputPhoneNorm = normalizePhone(phone);
    if (inputPhoneNorm.length < 9) {
      return new Response(
        JSON.stringify({ error: "Số điện thoại không hợp lệ." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service_role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order by order_number
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, subtotal, shipping_fee, discount, total,
        shipping_address, notes, created_at, updated_at,
        payment_gateway, delivery_method, customer_phone,
        order_items (id, product_name, variant_name, quantity, price, subtotal)
      `)
      .eq("order_number", orderNumber.trim().toUpperCase())
      .maybeSingle();

    if (orderError) throw orderError;

    if (!order) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy đơn hàng với mã này." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify phone against stored phone(s)
    const shippingAddress = order.shipping_address as Record<string, string> | null;
    const storedPhones = [
      order.customer_phone,
      shippingAddress?.phone,
    ].filter(Boolean);

    const phoneMatch = storedPhones.some(
      (stored) => normalizePhone(stored!) === inputPhoneNorm
    );

    if (!phoneMatch) {
      // Return same message as "not found" to prevent order number enumeration
      return new Response(
        JSON.stringify({ error: "Không tìm thấy đơn hàng với mã này." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch fulfillments (tracking info)
    const { data: fulfillments } = await supabase
      .from("order_fulfillments")
      .select("tracking_number, tracking_url, tracking_company, status, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });

    // Return sanitized response (strip internal id and customer_phone)
    const { id, customer_phone, ...safeOrder } = order;

    return new Response(
      JSON.stringify({
        order: safeOrder,
        fulfillments: fulfillments || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("track-order error:", err);
    return new Response(
      JSON.stringify({ error: "Đã xảy ra lỗi. Vui lòng thử lại." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

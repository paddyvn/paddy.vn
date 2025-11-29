import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_shipping_price_set?: {
    shop_money: { amount: string };
  };
  total_discounts: string;
  financial_status: string;
  fulfillment_status: string | null;
  note: string | null;
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    variant_title: string;
    price: string;
    quantity: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!shopifyDomain || !shopifyToken) {
      throw new Error('Shopify credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting Shopify orders sync...');

    // Fetch all orders from Shopify
    let allOrders: ShopifyOrder[] = [];
    let pageInfo: string | null = null;
    let pageCount = 0;

    do {
      pageCount++;
      const url: string = pageInfo
        ? `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=250&page_info=${pageInfo}`
        : `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=250&status=any`;

      console.log(`Fetching orders page ${pageCount}...`);

      const response: Response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      allOrders = allOrders.concat(data.orders);

      // Check for next page in Link header
      const linkHeader: string | null = response.headers.get('Link');
      if (linkHeader?.includes('rel="next"')) {
        const match: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/);
        pageInfo = match ? match[1] : null;
      } else {
        pageInfo = null;
      }

      console.log(`Fetched ${data.orders.length} orders (Total: ${allOrders.length})`);
    } while (pageInfo);

    console.log(`Total orders fetched: ${allOrders.length}`);

    // Map Shopify order status to our enum
    const mapOrderStatus = (financial: string, fulfillment: string | null) => {
      if (fulfillment === 'fulfilled') return 'delivered';
      if (fulfillment === 'partial') return 'shipped';
      if (financial === 'paid') return 'processing';
      if (financial === 'pending') return 'pending';
      if (financial === 'refunded' || financial === 'voided') return 'cancelled';
      return 'pending';
    };

    let syncedOrders = 0;
    let syncedItems = 0;

    // Process each order
    for (const shopifyOrder of allOrders) {
      try {
        const shippingFee = shopifyOrder.total_shipping_price_set?.shop_money?.amount || '0';
        
        // Upsert order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .upsert({
            shopify_order_id: shopifyOrder.id.toString(),
            order_number: shopifyOrder.name,
            user_id: null, // We don't have user mapping yet
            status: mapOrderStatus(shopifyOrder.financial_status, shopifyOrder.fulfillment_status),
            subtotal: parseFloat(shopifyOrder.subtotal_price),
            shipping_fee: parseFloat(shippingFee),
            discount: parseFloat(shopifyOrder.total_discounts),
            total: parseFloat(shopifyOrder.total_price),
            shipping_address: shopifyOrder.shipping_address || {},
            notes: shopifyOrder.note,
            created_at: shopifyOrder.created_at,
            updated_at: shopifyOrder.updated_at,
          }, {
            onConflict: 'shopify_order_id',
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (orderError) {
          console.error(`Error upserting order ${shopifyOrder.name}:`, orderError);
          continue;
        }

        syncedOrders++;

        // Delete existing order items for this order
        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', order.id);

        // Insert order items
        for (const lineItem of shopifyOrder.line_items) {
          // Try to find matching product/variant in our database
          const { data: product } = await supabase
            .from('products')
            .select('id')
            .eq('shopify_product_id', lineItem.product_id.toString())
            .single();

          let variantId = null;
          if (product) {
            const { data: variant } = await supabase
              .from('product_variants')
              .select('id')
              .eq('product_id', product.id)
              .eq('shopify_variant_id', lineItem.variant_id.toString())
              .single();
            
            if (variant) variantId = variant.id;
          }

          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              product_id: product?.id || null,
              product_name: lineItem.title,
              variant_id: variantId,
              variant_name: lineItem.variant_title,
              price: parseFloat(lineItem.price),
              quantity: lineItem.quantity,
              subtotal: parseFloat(lineItem.price) * lineItem.quantity,
            });

          if (itemError) {
            console.error(`Error inserting order item for order ${shopifyOrder.name}:`, itemError);
          } else {
            syncedItems++;
          }
        }

        console.log(`Synced order ${shopifyOrder.name} with ${shopifyOrder.line_items.length} items`);
      } catch (error) {
        console.error(`Error processing order ${shopifyOrder.name}:`, error);
      }
    }

    console.log(`Sync complete: ${syncedOrders} orders, ${syncedItems} order items`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          syncedOrders,
          syncedItems,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

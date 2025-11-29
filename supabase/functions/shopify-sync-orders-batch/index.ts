import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_shipping_price_set?: {
    shop_money: { amount: string };
  };
  total_discounts: string;
  financial_status: string;
  fulfillment_status: string | null;
  note: string | null;
  shipping_address?: any;
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
    const { continueFrom, createdAtMin, createdAtMax } = await req.json();

    const batchSize = 50; // Process 50 orders at a time
    
    // Build Shopify API URL
    // Note: When using page_info, we cannot include other parameters
    let url: string;
    if (continueFrom) {
      url = `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=${batchSize}&page_info=${continueFrom}`;
    } else if (createdAtMin) {
      // Incremental sync - fetch orders created after the most recent one we have
      url = `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=${batchSize}&status=any&created_at_min=${createdAtMin}`;
    } else if (createdAtMax) {
      // Backward sync - fetch orders created before the oldest one we have
      url = `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=${batchSize}&status=any&created_at_max=${createdAtMax}`;
    } else {
      // Full sync from the beginning
      url = `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=${batchSize}&status=any`;
    }

    console.log('Fetching batch of orders...');

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
    const orders: ShopifyOrder[] = data.orders;

    console.log(`Processing ${orders.length} orders...`);

    // Map Shopify order status to our enum
    const mapOrderStatus = (financial: string, fulfillment: string | null) => {
      if (fulfillment === 'fulfilled') return 'delivered';
      if (fulfillment === 'partial') return 'shipped';
      if (financial === 'paid') return 'processing';
      if (financial === 'pending') return 'pending';
      if (financial === 'refunded' || financial === 'voided') return 'cancelled';
      return 'pending';
    };

    // Collect all unique Shopify product and variant IDs
    const productIds = new Set<string>();
    const variantIds = new Set<string>();
    
    orders.forEach(order => {
      order.line_items.forEach(item => {
        productIds.add(item.product_id.toString());
        variantIds.add(item.variant_id.toString());
      });
    });

    // Batch fetch all products and variants
    const { data: products } = await supabase
      .from('products')
      .select('id, shopify_product_id')
      .in('shopify_product_id', Array.from(productIds));

    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, product_id, shopify_variant_id')
      .in('shopify_variant_id', Array.from(variantIds));

    // Create lookup maps
    const productMap = new Map(products?.map(p => [p.shopify_product_id, p.id]) || []);
    const variantMap = new Map(variants?.map(v => [v.shopify_variant_id, v.id]) || []);

    let syncedOrders = 0;
    let syncedItems = 0;

    // Process each order
    for (const shopifyOrder of orders) {
      try {
        const shippingFee = shopifyOrder.total_shipping_price_set?.shop_money?.amount || '0';
        
        // Upsert order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .upsert({
            shopify_order_id: shopifyOrder.id.toString(),
            order_number: shopifyOrder.name,
            user_id: null,
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

        // Delete existing order items
        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', order.id);

        // Batch insert order items
        const orderItems = shopifyOrder.line_items.map(lineItem => {
          const productId = productMap.get(lineItem.product_id.toString()) || null;
          const variantId = variantMap.get(lineItem.variant_id.toString()) || null;

          return {
            order_id: order.id,
            product_id: productId,
            product_name: lineItem.title,
            variant_id: variantId,
            variant_name: lineItem.variant_title,
            price: parseFloat(lineItem.price),
            quantity: lineItem.quantity,
            subtotal: parseFloat(lineItem.price) * lineItem.quantity,
          };
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (!itemsError) {
          syncedItems += orderItems.length;
        } else {
          console.error(`Error inserting items for order ${shopifyOrder.name}:`, itemsError);
        }
      } catch (error) {
        console.error(`Error processing order ${shopifyOrder.name}:`, error);
      }
    }

    // Check for next page
    const linkHeader: string | null = response.headers.get('Link');
    let nextBatch = null;
    
    if (linkHeader?.includes('rel="next"')) {
      const match: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/);
      nextBatch = match ? match[1] : null;
    }

    console.log(`Batch complete: ${syncedOrders} orders, ${syncedItems} items`);

    return new Response(
      JSON.stringify({
        success: true,
        hasMore: !!nextBatch,
        nextBatch,
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

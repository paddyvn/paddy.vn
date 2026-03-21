import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to fetch with retry and timeout
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  timeoutMs = 15000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Handle 429 rate limiting with retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000 * attempt;
        console.warn(`Rate limited (429), waiting ${waitMs}ms before retry ${attempt}/${retries}`);
        await response.text(); // consume body
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Fetch attempt ${attempt}/${retries} failed: ${lastError.message}`);
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError || new Error('Fetch failed after retries');
}

// Helper to safely read JSON response
async function safeJsonParse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
  }
}

interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  cancelled_at: string | null;
  closed_at: string | null;
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
  gateway: string | null;
  currency: string;
  tags: string | null;
  source_name: string | null;
  customer?: {
    email: string | null;
    phone: string | null;
  };
  email: string | null;
  phone: string | null;
  line_items: Array<{
    id: number;
    product_id: number | null;
    variant_id: number | null;
    title: string;
    variant_title: string;
    price: string;
    quantity: number;
  }>;
  fulfillments?: Array<{
    id: number;
    status: string;
    tracking_number: string | null;
    tracking_url: string | null;
    tracking_company: string | null;
    location_id: number | null;
    shipment_status: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

interface ShopifyEvent {
  id: number;
  created_at: string;
  message: string;
  author: string | null;
  verb: string;
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!shopifyDomain || !shopifyToken || !supabaseAnonKey) {
      throw new Error('Required credentials not configured');
    }

    // Check for cron secret bypass
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    const isCronRequest = cronSecret && expectedCronSecret && cronSecret === expectedCronSecret;

    if (isCronRequest) {
      console.log('Cron request authenticated via CRON_SECRET');
    }

    // Verify admin authentication (skip if cron request)
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    const keys = Array.from(req.headers.keys());
    console.log(`Received headers: ${keys.join(', ')}`);

    if (!isCronRequest && !authHeader) {
      console.error('Authentication failed: Authorization header missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Safe diagnostics (no token leakage)
    if (authHeader) {
      console.log(
        `Authorization format ok: ${authHeader.startsWith('Bearer ')} | length: ${authHeader.length}`
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!isCronRequest) {
      const bearerValue = authHeader!.includes(',') ? authHeader!.split(',')[0].trim() : authHeader!;
      const jwt = bearerValue.replace(/^Bearer\s+/i, '').trim();

      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      const { data: { user }, error: authError } = await authClient.auth.getUser(jwt);
      if (authError || !user) {
        console.error('Authentication failed:', authError?.message);
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        console.error('Admin check failed:', roleError?.message || 'No admin role found');
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden - Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Admin authenticated:', user.id);
    }
    
    let { continueFrom, updatedAtMin, createdAtMax, syncEvents = true } = await req.json().catch(() => ({}));

    // When called by cron with empty body, auto-determine incremental sync point
    if (isCronRequest && !continueFrom && !updatedAtMin && !createdAtMax) {
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (lastOrder?.updated_at) {
        updatedAtMin = lastOrder.updated_at;
        console.log(`Cron: incremental sync from ${updatedAtMin}`);
      } else {
        console.log('Cron: no existing orders, doing full sync');
      }
      // Disable events sync for cron to stay within timeout
      syncEvents = false;
    }

    const batchSize = 50;
    const MAX_PAGES = 20;
    let totalSyncedOrders = 0;
    let totalSyncedItems = 0;
    let totalSyncedFulfillments = 0;
    let totalSyncedEvents = 0;
    let pageCount = 0;

    do {
      pageCount++;

      // Build Shopify API URL
      let url: string;
      if (continueFrom) {
        url = `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=${batchSize}&page_info=${continueFrom}`;
      } else if (updatedAtMin) {
        url = `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=${batchSize}&status=any&updated_at_min=${updatedAtMin}`;
      } else if (createdAtMax) {
        url = `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=${batchSize}&status=any&created_at_max=${createdAtMax}`;
      } else {
        url = `https://${shopifyDomain}/admin/api/2024-01/orders.json?limit=${batchSize}&status=any`;
      }

      console.log(`Fetching orders page ${pageCount}...`);

      const response = await fetchWithRetry(url, {
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
        },
      }, 3, 30000);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
      }

      const data = await safeJsonParse(response);
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
          if (item.product_id) productIds.add(item.product_id.toString());
          if (item.variant_id) variantIds.add(item.variant_id.toString());
        });
      });

      // Batch fetch all products and variants
      const { data: products } = await supabase
        .from('products')
        .select('id, source_id')
        .in('source_id', Array.from(productIds));

      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, product_id, source_variant_id')
        .in('source_variant_id', Array.from(variantIds));

      // Create lookup maps
      const productMap = new Map(products?.map(p => [p.source_id, p.id]) || []);
      const variantMap = new Map(variants?.map(v => [v.source_variant_id, v.id]) || []);

      let syncedOrders = 0;
      let syncedItems = 0;
      let syncedEvents = 0;
      let syncedFulfillments = 0;

      // Process each order
      for (const shopifyOrder of orders) {
        try {
          const shippingFee = shopifyOrder.total_shipping_price_set?.shop_money?.amount || '0';

          // FIXED: Extract contact info with shipping_address fallback
          // Vietnamese Shopify orders often have phone in shipping_address but not in order.phone
          const customerEmail = shopifyOrder.email 
            || shopifyOrder.customer?.email 
            || shopifyOrder.shipping_address?.email 
            || null;
          const customerPhone = shopifyOrder.phone 
            || shopifyOrder.customer?.phone 
            || shopifyOrder.shipping_address?.phone 
            || null;

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
              financial_status: shopifyOrder.financial_status,
              fulfillment_status: shopifyOrder.fulfillment_status || 'unfulfilled',
              payment_gateway: shopifyOrder.gateway,
              currency: shopifyOrder.currency || 'VND',
              tags: shopifyOrder.tags,
              source_name: shopifyOrder.source_name,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              cancelled_at: shopifyOrder.cancelled_at,
              closed_at: shopifyOrder.closed_at,
              processed_at: shopifyOrder.processed_at,
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

          // Upsert order items then cleanup orphans
          const syncedItemIds: string[] = [];
          for (const lineItem of shopifyOrder.line_items) {
            const productId = lineItem.product_id
              ? productMap.get(lineItem.product_id.toString()) || null
              : null;
            const variantId = lineItem.variant_id
              ? variantMap.get(lineItem.variant_id.toString()) || null
              : null;

            const { data: item, error: itemError } = await supabase
              .from('order_items')
              .upsert({
                order_id: order.id,
                shopify_line_item_id: lineItem.id.toString(),
                product_id: productId,
                product_name: lineItem.title,
                variant_id: variantId,
                variant_name: lineItem.variant_title,
                price: parseFloat(lineItem.price),
                quantity: lineItem.quantity,
                subtotal: parseFloat(lineItem.price) * lineItem.quantity,
              }, {
                onConflict: 'order_id,shopify_line_item_id',
              })
              .select('id')
              .single();

            if (!itemError && item) {
              syncedItemIds.push(item.id);
              syncedItems++;
            }
          }

          // Clean up items no longer in Shopify
          if (syncedItemIds.length > 0) {
            await supabase
              .from('order_items')
              .delete()
              .eq('order_id', order.id)
              .not('id', 'in', `(${syncedItemIds.join(',')})`);
          }

          // Upsert fulfillments then cleanup orphans
          if (shopifyOrder.fulfillments && shopifyOrder.fulfillments.length > 0) {
            const syncedFulfillmentIds: string[] = [];

            for (const f of shopifyOrder.fulfillments) {
              const { data: ful, error: fulfillmentError } = await supabase
                .from('order_fulfillments')
                .upsert({
                  order_id: order.id,
                  shopify_fulfillment_id: f.id.toString(),
                  status: f.status,
                  tracking_number: f.tracking_number,
                  tracking_url: f.tracking_url,
                  tracking_company: f.tracking_company,
                  shipment_status: f.shipment_status,
                  created_at: f.created_at,
                  updated_at: f.updated_at,
                }, {
                  onConflict: 'order_id,shopify_fulfillment_id',
                })
                .select('id')
                .single();

              if (!fulfillmentError && ful) {
                syncedFulfillmentIds.push(ful.id);
                syncedFulfillments++;
              }
            }

            // Clean up fulfillments no longer in Shopify
            if (syncedFulfillmentIds.length > 0) {
              await supabase
                .from('order_fulfillments')
                .delete()
                .eq('order_id', order.id)
                .not('id', 'in', `(${syncedFulfillmentIds.join(',')})`);
            }
          }

          // Upsert order events then cleanup orphans
          if (syncEvents) {
            try {
              const eventsUrl = `https://${shopifyDomain}/admin/api/2024-01/orders/${shopifyOrder.id}/events.json`;
              const eventsResponse = await fetchWithRetry(eventsUrl, {
                headers: { 'X-Shopify-Access-Token': shopifyToken },
              }, 2, 10000);

              if (eventsResponse.ok) {
                const eventsData = await safeJsonParse(eventsResponse);
                const events: ShopifyEvent[] = eventsData.events || [];

                if (events.length > 0) {
                  const syncedEventIds: string[] = [];

                  for (const event of events) {
                    const { data: ev, error: eventsError } = await supabase
                      .from('order_events')
                      .upsert({
                        order_id: order.id,
                        shopify_event_id: event.id.toString(),
                        event_type: event.verb,
                        message: event.message,
                        author: event.author,
                        created_at: event.created_at,
                      }, {
                        onConflict: 'order_id,shopify_event_id',
                      })
                      .select('id')
                      .single();

                    if (!eventsError && ev) {
                      syncedEventIds.push(ev.id);
                      syncedEvents++;
                    }
                  }

                  // Clean up events no longer in Shopify
                  if (syncedEventIds.length > 0) {
                    await supabase
                      .from('order_events')
                      .delete()
                      .eq('order_id', order.id)
                      .not('id', 'in', `(${syncedEventIds.join(',')})`);
                  }
                }
              }
            } catch (eventError) {
              console.warn(`Skipping events for order ${shopifyOrder.name}: ${eventError instanceof Error ? eventError.message : 'Unknown error'}`);
            }
          }
        } catch (error) {
          console.error(`Error processing order ${shopifyOrder.name}:`, error);
        }
      }

      totalSyncedOrders += syncedOrders;
      totalSyncedItems += syncedItems;
      totalSyncedFulfillments += syncedFulfillments;
      totalSyncedEvents += syncedEvents;

      // Check for next page
      const linkHeader: string | null = response.headers.get('Link');
      continueFrom = null;

      if (linkHeader?.includes('rel="next"')) {
        const match: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/);
        continueFrom = match ? match[1] : null;
      }

      // Only loop if cron request; manual requests return after one page
      if (!isCronRequest) break;

      // Small delay between pages to avoid rate limiting
      if (continueFrom) {
        await new Promise(r => setTimeout(r, 2000));
      }

    } while (continueFrom && pageCount < MAX_PAGES);

    console.log(`Sync complete: ${totalSyncedOrders} orders, ${totalSyncedItems} items, ${totalSyncedFulfillments} fulfillments, ${totalSyncedEvents} events (${pageCount} pages)`);

    return new Response(
      JSON.stringify({
        success: true,
        hasMore: !!continueFrom,
        nextBatch: continueFrom,
        stats: {
          syncedOrders: totalSyncedOrders,
          syncedItems: totalSyncedItems,
          syncedFulfillments: totalSyncedFulfillments,
          syncedEvents: totalSyncedEvents,
          pagesProcessed: pageCount,
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

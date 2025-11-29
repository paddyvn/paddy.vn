import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyCustomer {
  id: number;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  orders_count: number;
  total_spent: string;
  accepts_marketing: boolean;
  marketing_opt_in_level: string | null;
  tags: string;
  note: string | null;
  verified_email: boolean;
  created_at: string;
  updated_at: string;
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

    const batchSize = 50;
    
    // Build Shopify API URL
    let url: string;
    if (continueFrom) {
      url = `https://${shopifyDomain}/admin/api/2024-01/customers.json?limit=${batchSize}&page_info=${continueFrom}`;
    } else if (createdAtMin) {
      url = `https://${shopifyDomain}/admin/api/2024-01/customers.json?limit=${batchSize}&created_at_min=${createdAtMin}`;
    } else if (createdAtMax) {
      url = `https://${shopifyDomain}/admin/api/2024-01/customers.json?limit=${batchSize}&created_at_max=${createdAtMax}`;
    } else {
      url = `https://${shopifyDomain}/admin/api/2024-01/customers.json?limit=${batchSize}`;
    }

    console.log('Fetching batch of customers...');

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
    const customers: ShopifyCustomer[] = data.customers;

    console.log(`Processing ${customers.length} customers...`);

    let syncedCustomers = 0;

    // Process each customer
    for (const shopifyCustomer of customers) {
      try {
        const { error: customerError } = await supabase
          .from('customers')
          .upsert({
            shopify_customer_id: shopifyCustomer.id.toString(),
            email: shopifyCustomer.email,
            phone: shopifyCustomer.phone,
            first_name: shopifyCustomer.first_name,
            last_name: shopifyCustomer.last_name,
            orders_count: shopifyCustomer.orders_count,
            total_spent: parseFloat(shopifyCustomer.total_spent),
            accepts_marketing: shopifyCustomer.accepts_marketing,
            marketing_opt_in_level: shopifyCustomer.marketing_opt_in_level,
            tags: shopifyCustomer.tags,
            note: shopifyCustomer.note,
            verified_email: shopifyCustomer.verified_email,
            shopify_created_at: shopifyCustomer.created_at,
            shopify_updated_at: shopifyCustomer.updated_at,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'shopify_customer_id',
            ignoreDuplicates: false,
          });

        if (customerError) {
          console.error(`Error upserting customer ${shopifyCustomer.email}:`, customerError);
          continue;
        }

        syncedCustomers++;
      } catch (error) {
        console.error(`Error processing customer ${shopifyCustomer.email}:`, error);
      }
    }

    // Check for next page
    const linkHeader: string | null = response.headers.get('Link');
    let nextBatch = null;
    
    if (linkHeader?.includes('rel="next"')) {
      const match: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/);
      nextBatch = match ? match[1] : null;
    }

    console.log(`Batch complete: ${syncedCustomers} customers`);

    return new Response(
      JSON.stringify({
        success: true,
        hasMore: !!nextBatch,
        nextBatch,
        stats: {
          syncedCustomers,
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyAddress {
  id: number;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string | null;
  country: string;
  country_code: string | null;
  zip: string | null;
  phone: string | null;
  default: boolean;
}

interface SmsMarketingConsent {
  state: string;
  opt_in_level: string | null;
  consent_updated_at: string | null;
  consent_collected_from: string | null;
}

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
  addresses: ShopifyAddress[];
  state: string;
  tax_exempt: boolean;
  sms_marketing_consent: SmsMarketingConsent | null;
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

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'Auth session missing!');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin role using service role client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
        const { data: customerData, error: customerError } = await supabase
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
            state: shopifyCustomer.state || 'enabled',
            tax_exempt: shopifyCustomer.tax_exempt || false,
            sms_marketing_consent: shopifyCustomer.sms_marketing_consent,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'shopify_customer_id',
            ignoreDuplicates: false,
          })
          .select('id')
          .single();

        if (customerError || !customerData) {
          console.error(`Error upserting customer ${shopifyCustomer.email}:`, customerError);
          continue;
        }

        // Sync customer addresses
        if (shopifyCustomer.addresses && shopifyCustomer.addresses.length > 0) {
          for (const address of shopifyCustomer.addresses) {
            const { error: addressError } = await supabase
              .from('customer_addresses')
              .upsert({
                customer_id: customerData.id,
                first_name: address.first_name,
                last_name: address.last_name,
                company: address.company,
                address1: address.address1,
                address2: address.address2,
                city: address.city,
                province: address.province,
                country: address.country || 'Vietnam',
                country_code: address.country_code || 'VN',
                postal_code: address.zip,
                phone: address.phone,
                is_default: address.default,
              }, {
                onConflict: 'customer_id,address1,city',
                ignoreDuplicates: false,
              });

            if (addressError) {
              console.error(`Error upserting address for customer ${shopifyCustomer.email}:`, addressError);
            }
          }
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

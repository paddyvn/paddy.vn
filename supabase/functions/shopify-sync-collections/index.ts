import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyRule {
  column: string;
  relation: string;
  condition: string;
}

interface ShopifyCollection {
  id: number;
  title: string;
  handle: string;
  body_html: string | null;
  image: {
    src: string;
    alt: string | null;
  } | null;
  sort_order: string;
  updated_at: string;
  rules?: ShopifyRule[];
  disjunctive?: boolean;
}

// Fix 5: Helper to paginate Shopify API
async function fetchAllPages<T>(
  baseUrl: string,
  token: string,
  dataKey: string,
): Promise<T[]> {
  let allItems: T[] = [];
  let url: string | null = baseUrl;

  while (url) {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    allItems = allItems.concat(data[dataKey] || []);

    // Check for next page via Link header
    const linkHeader = response.headers.get('Link');
    url = null;
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (nextMatch) url = nextMatch[1];
    }
  }

  return allItems;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const SHOPIFY_ADMIN_API_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
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
    console.log('Starting Shopify collections sync...');

    // Fix 5: Paginate both custom and smart collections
    const customCollections = await fetchAllPages<ShopifyCollection>(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/custom_collections.json?limit=250`,
      SHOPIFY_ADMIN_API_TOKEN,
      'custom_collections',
    );

    const smartCollections = await fetchAllPages<ShopifyCollection>(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/smart_collections.json?limit=250`,
      SHOPIFY_ADMIN_API_TOKEN,
      'smart_collections',
    );

    // Combine all collections with type tracking
    const allCollections = [
      ...customCollections.map(c => ({ ...c, type: 'custom' })),
      ...smartCollections.map(c => ({ ...c, type: 'smart' }))
    ];
    console.log(`Total collections to sync: ${allCollections.length} (${customCollections.length} custom, ${smartCollections.length} smart)`);

    let syncedCollections = 0;
    const errors: string[] = [];

    // Sync each collection
    for (const collection of allCollections) {
      try {
        const description = collection.body_html
          ? collection.body_html.replace(/<[^>]*>/g, '').substring(0, 500)
          : null;

        let rules = null;
        let rulesMatchType = 'all';
        
        if (collection.type === 'smart' && collection.rules && collection.rules.length > 0) {
          rules = collection.rules.map(rule => ({
            field: rule.column === 'title' ? 'name' : rule.column,
            operator: rule.relation,
            value: rule.condition,
          }));
          rulesMatchType = collection.disjunctive ? 'any' : 'all';
        }

        const { error: categoryError } = await supabase
          .from('categories')
          .upsert({
            slug: collection.handle,
            name: collection.title,
            description: description,
            image_url: collection.image?.src || null,
            is_active: true,
            display_order: syncedCollections,
            shopify_collection_id: collection.id.toString(),
            collection_type: collection.type,
            rules: rules,
            rules_match_type: rulesMatchType,
          }, {
            onConflict: 'slug',
            ignoreDuplicates: false,
          });

        if (categoryError) {
          errors.push(`Collection ${collection.title}: ${categoryError.message}`);
          console.error('Collection sync error:', categoryError);
          continue;
        }

        syncedCollections++;
        console.log(`Synced collection: ${collection.title}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Collection ${collection.title}: ${errorMessage}`);
        console.error(`Error syncing collection ${collection.title}:`, error);
      }
    }

    console.log('Collections sync completed!');
    console.log(`Collections synced: ${syncedCollections}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${syncedCollections} collections from Shopify`,
        stats: {
          totalCollections: allCollections.length,
          syncedCollections,
          errors: errors.length,
          duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: 'Failed to sync Shopify collections',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

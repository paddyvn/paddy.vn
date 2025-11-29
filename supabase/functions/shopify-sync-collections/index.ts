import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting Shopify collections sync...');

    // Fetch custom collections
    const customCollectionsResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/custom_collections.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!customCollectionsResponse.ok) {
      const errorText = await customCollectionsResponse.text();
      throw new Error(`Shopify API error (custom collections): ${customCollectionsResponse.status} - ${errorText}`);
    }

    const customCollectionsData = await customCollectionsResponse.json();
    const customCollections: ShopifyCollection[] = customCollectionsData.custom_collections || [];

    // Fetch smart collections
    const smartCollectionsResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/smart_collections.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!smartCollectionsResponse.ok) {
      const errorText = await smartCollectionsResponse.text();
      throw new Error(`Shopify API error (smart collections): ${smartCollectionsResponse.status} - ${errorText}`);
    }

    const smartCollectionsData = await smartCollectionsResponse.json();
    const smartCollections: ShopifyCollection[] = smartCollectionsData.smart_collections || [];

    // Combine all collections with type tracking
    const allCollections = [
      ...customCollections.map(c => ({ ...c, type: 'custom' })),
      ...smartCollections.map(c => ({ ...c, type: 'smart' }))
    ];
    console.log(`Total collections to sync: ${allCollections.length}`);

    let syncedCollections = 0;
    const errors: string[] = [];

    // Sync each collection
    for (const collection of allCollections) {
      try {
        // Extract description from body_html
        const description = collection.body_html
          ? collection.body_html.replace(/<[^>]*>/g, '').substring(0, 500)
          : null;

        // Upsert category with Shopify collection ID and type
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
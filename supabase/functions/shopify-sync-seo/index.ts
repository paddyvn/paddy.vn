import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Starting Shopify SEO fields sync...');

    // Get all products from our database that have a shopify_product_id
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, shopify_product_id, name')
      .not('shopify_product_id', 'is', null);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    console.log(`Found ${products?.length || 0} products to sync SEO fields`);

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process products in batches to avoid rate limiting
    for (const product of products || []) {
      try {
        // Fetch metafields for this product from Shopify
        const metafieldsUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/products/${product.shopify_product_id}/metafields.json`;
        
        const response = await fetch(metafieldsUrl, {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch metafields for product ${product.shopify_product_id}: ${response.status}`);
          errorCount++;
          continue;
        }

        const data = await response.json();
        const metafields = data.metafields || [];

        // Find SEO metafields (namespace: global, key: title_tag or description_tag)
        const seoTitle = metafields.find(
          (m: any) => m.namespace === 'global' && m.key === 'title_tag'
        );
        const seoDescription = metafields.find(
          (m: any) => m.namespace === 'global' && m.key === 'description_tag'
        );

        // Only update if we found SEO data
        if (seoTitle || seoDescription) {
          const updateData: { meta_title?: string; meta_description?: string } = {};
          
          if (seoTitle?.value) {
            updateData.meta_title = seoTitle.value;
          }
          if (seoDescription?.value) {
            updateData.meta_description = seoDescription.value;
          }

          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', product.id);

          if (updateError) {
            console.error(`Failed to update product ${product.name}: ${updateError.message}`);
            errors.push(`${product.name}: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`Updated SEO for: ${product.name} (title: ${!!seoTitle}, desc: ${!!seoDescription})`);
            syncedCount++;
          }
        } else {
          skippedCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing product ${product.name}: ${errorMessage}`);
        errors.push(`${product.name}: ${errorMessage}`);
        errorCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`SEO sync completed! Synced: ${syncedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}, Duration: ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `SEO sync completed`,
        stats: {
          totalProducts: products?.length || 0,
          synced: syncedCount,
          skipped: skippedCount,
          errors: errorCount,
          duration: `${duration}s`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('SEO sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: 'Failed to sync SEO fields',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 50;

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

    // Parse request body for pagination
    let offset = 0;
    let forceResync = false;
    try {
      const body = await req.json();
      offset = body.offset || 0;
      forceResync = body.forceResync || false;
    } catch {
      // No body or invalid JSON, use defaults
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Starting Shopify SEO sync - Offset: ${offset}, Batch size: ${BATCH_SIZE}`);

    // Build query - skip products that already have meta_description unless forceResync
    let query = supabase
      .from('products')
      .select('id, shopify_product_id, name, meta_description, meta_title', { count: 'exact' })
      .not('shopify_product_id', 'is', null);

    if (!forceResync) {
      // Only get products that don't have meta_description yet
      query = query.is('meta_description', null);
    }

    // Get products with pagination
    const { data: products, error: productsError, count: totalCount } = await query
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    const remaining = (totalCount || 0) - offset - (products?.length || 0);
    console.log(`Processing ${products?.length || 0} products. Total remaining without SEO: ${remaining}`);

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

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
          console.error(`Failed to fetch metafields for ${product.name}: ${response.status}`);
          errorCount++;
          continue;
        }

        const data = await response.json();
        const metafields = data.metafields || [];

        // Find SEO metafields
        const seoTitle = metafields.find(
          (m: any) => m.namespace === 'global' && m.key === 'title_tag'
        );
        const seoDescription = metafields.find(
          (m: any) => m.namespace === 'global' && m.key === 'description_tag'
        );

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
            console.error(`Update failed for ${product.name}: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`Synced: ${product.name}`);
            syncedCount++;
          }
        } else {
          // Mark as processed by setting empty string to avoid re-processing
          // Actually, skip this - we'll just mark products with no SEO data in Shopify
          skippedCount++;
          console.log(`No SEO data in Shopify for: ${product.name}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error for ${product.name}: ${errorMessage}`);
        errorCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const hasMore = remaining > 0;
    const nextOffset = offset + BATCH_SIZE;

    console.log(`Batch complete! Synced: ${syncedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: hasMore ? `Batch complete. ${remaining} products remaining.` : 'All products processed!',
        stats: {
          batchSize: products?.length || 0,
          synced: syncedCount,
          skipped: skippedCount,
          errors: errorCount,
          remaining: remaining,
          nextOffset: hasMore ? nextOffset : null,
          hasMore,
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
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

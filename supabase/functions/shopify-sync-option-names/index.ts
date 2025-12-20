import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyProductOption {
  name: string;
  position: number;
  values: string[];
}

interface ShopifyProduct {
  id: number;
  options: ShopifyProductOption[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shopifyStore = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!shopifyStore || !shopifyToken) {
      throw new Error('Missing Shopify credentials');
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for pagination
    const { continueFrom, batchSize = 50 } = await req.json().catch(() => ({}));

    // Find products that have variants with option values but no option names set
    let query = supabase
      .from('products')
      .select('id, source_id, name')
      .is('option1_name', null)
      .not('source_id', 'is', null);

    // If continuing from a specific ID, filter from there
    if (continueFrom) {
      query = query.gt('id', continueFrom);
    }

    const { data: products, error: productsError } = await query
      .order('id', { ascending: true })
      .limit(batchSize);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No products to update',
        stats: { updatedProducts: 0, totalProcessed: 0 },
        hasMore: false,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${products.length} products...`);

    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        // Extract Shopify product ID from source_id
        // Handle both formats: "gid://shopify/Product/123456" or just "123456"
        let shopifyProductId: string;
        const gidMatch = product.source_id.match(/\/(\d+)$/);
        if (gidMatch) {
          shopifyProductId = gidMatch[1];
        } else if (/^\d+$/.test(product.source_id)) {
          // Plain numeric ID
          shopifyProductId = product.source_id;
        } else {
          console.log(`Invalid source_id format for product ${product.id}: ${product.source_id}`);
          continue;
        }

        // Fetch product from Shopify - only get options field
        const shopifyUrl = `https://${shopifyStore}/admin/api/2024-01/products/${shopifyProductId}.json?fields=id,options`;
        
        let shopifyResponse: Response | null = null;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          shopifyResponse = await fetch(shopifyUrl, {
            headers: {
              'X-Shopify-Access-Token': shopifyToken,
              'Content-Type': 'application/json',
            },
          });

          if (shopifyResponse.status === 429) {
            // Rate limited - wait longer and retry
            retries++;
            const waitTime = 2000 * retries; // 2s, 4s, 6s
            console.log(`Rate limited, waiting ${waitTime}ms before retry ${retries}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          break;
        }

        if (!shopifyResponse || !shopifyResponse.ok) {
          if (shopifyResponse?.status === 404) {
            console.log(`Product ${shopifyProductId} not found in Shopify, skipping`);
            continue;
          }
          if (shopifyResponse?.status === 429) {
            throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
          }
          throw new Error(`Shopify API error: ${shopifyResponse?.status}`);
        }

        const shopifyData = await shopifyResponse.json();
        const shopifyProduct: ShopifyProduct = shopifyData.product;

        if (!shopifyProduct.options || shopifyProduct.options.length === 0) {
          console.log(`Product ${product.id} has no options in Shopify`);
          continue;
        }

        // Extract option names (sorted by position)
        const sortedOptions = shopifyProduct.options.sort((a, b) => a.position - b.position);
        
        const updateData: Record<string, string | null> = {
          option1_name: sortedOptions[0]?.name || null,
          option2_name: sortedOptions[1]?.name || null,
          option3_name: sortedOptions[2]?.name || null,
        };

        // Skip if all options are "Title" (default Shopify single variant)
        if (updateData.option1_name === 'Title' && !updateData.option2_name && !updateData.option3_name) {
          console.log(`Product ${product.id} has only default "Title" option, skipping`);
          continue;
        }

        // Update product in Supabase
        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', product.id);

        if (updateError) {
          throw new Error(`Failed to update product ${product.id}: ${updateError.message}`);
        }

        updatedCount++;
        console.log(`Updated product "${product.name}" with options: ${JSON.stringify(updateData)}`);

        // Rate limiting - wait 1 second between requests to stay under Shopify's limit
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (productError) {
        errorCount++;
        const errorMessage = productError instanceof Error ? productError.message : 'Unknown error';
        errors.push(`Product ${product.id}: ${errorMessage}`);
        console.error(`Error processing product ${product.id}:`, errorMessage);
      }
    }

    const lastProductId = products[products.length - 1]?.id;
    
    // Check if there are more products to process
    const { count: remainingCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .is('option1_name', null)
      .not('source_id', 'is', null)
      .gt('id', lastProductId);

    const hasMore = (remainingCount || 0) > 0;

    return new Response(JSON.stringify({
      success: true,
      stats: {
        updatedProducts: updatedCount,
        totalProcessed: products.length,
        errorCount,
      },
      hasMore,
      nextBatch: hasMore ? lastProductId : null,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in shopify-sync-option-names:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

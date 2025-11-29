import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  handle: string;
  status: string;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
    position: number;
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string | null;
    inventory_quantity: number;
    weight: number | null;
  }>;
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

    // Get batch parameters from request
    const { batchSize = 50, continueFrom = null } = await req.json().catch(() => ({}));

    console.log(`Starting batch sync (batch size: ${batchSize}, continue from: ${continueFrom || 'start'})...`);

    // Build URL with pagination
    let url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/products.json?limit=${batchSize}`;
    if (continueFrom) {
      url = continueFrom;
    }

    const response: Response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const products: ShopifyProduct[] = data.products || [];
    
    console.log(`Fetched ${products.length} products from Shopify`);

    // Get next page URL from Link header
    const linkHeader: string | null = response.headers.get('Link');
    let nextPageUrl: string | null = null;
    
    if (linkHeader) {
      const links: string[] = linkHeader.split(',');
      for (const link of links) {
        if (link.includes('rel="next"')) {
          const match: RegExpMatchArray | null = link.match(/<([^>]+)>/);
          if (match) {
            nextPageUrl = match[1];
          }
        }
      }
    }

    let syncedProducts = 0;
    let syncedImages = 0;
    let syncedVariants = 0;
    const errors: string[] = [];

    // Sync each product in this batch
    for (const shopifyProduct of products) {
      try {
        const shortDescription = shopifyProduct.body_html
          ? shopifyProduct.body_html.replace(/<[^>]*>/g, '').substring(0, 200)
          : null;

        const basePrice = shopifyProduct.variants[0]?.price || '0';
        const compareAtPrice = shopifyProduct.variants[0]?.compare_at_price;

        // Upsert product
        const { data: product, error: productError } = await supabase
          .from('products')
          .upsert({
            shopify_product_id: shopifyProduct.id.toString(),
            name: shopifyProduct.title,
            slug: shopifyProduct.handle,
            description: shopifyProduct.body_html,
            short_description: shortDescription,
            base_price: parseFloat(basePrice),
            compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
            is_active: shopifyProduct.status === 'active',
            is_featured: false,
          }, {
            onConflict: 'shopify_product_id',
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (productError) {
          errors.push(`Product ${shopifyProduct.title}: ${productError.message}`);
          continue;
        }

        syncedProducts++;

        // Delete existing images and variants for clean sync
        await supabase.from('product_images').delete().eq('product_id', product.id);
        await supabase.from('product_variants').delete().eq('product_id', product.id);

        // Sync images
        for (const image of shopifyProduct.images) {
          const { error: imageError } = await supabase
            .from('product_images')
            .insert({
              product_id: product.id,
              image_url: image.src,
              alt_text: image.alt || shopifyProduct.title,
              is_primary: image.position === 1,
              display_order: image.position,
            });

          if (!imageError) syncedImages++;
        }

        // Sync variants
        for (const variant of shopifyProduct.variants) {
          const { error: variantError } = await supabase
            .from('product_variants')
            .insert({
              product_id: product.id,
              shopify_variant_id: variant.id.toString(),
              name: variant.title,
              price: parseFloat(variant.price),
              compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
              sku: variant.sku || null,
              stock_quantity: variant.inventory_quantity,
              weight: variant.weight,
            });

          if (!variantError) syncedVariants++;
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Product ${shopifyProduct.title}: ${errorMessage}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Batch sync completed in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${syncedProducts} products in this batch`,
        stats: {
          batchSize: products.length,
          syncedProducts,
          syncedImages,
          syncedVariants,
          errors: errors.length,
          duration: `${duration}s`,
        },
        hasMore: !!nextPageUrl,
        nextBatch: nextPageUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Batch sync error:', error);
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

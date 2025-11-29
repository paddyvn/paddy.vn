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
  tags: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
    position: number;
    variant_ids: number[];
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string | null;
    inventory_quantity: number;
    weight: number | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    barcode: string | null;
    image_id: number | null;
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

    console.log('Starting Shopify product sync...');

    // Fetch all products from Shopify with cursor-based pagination
    let allProducts: ShopifyProduct[] = [];
    let nextPageUrl: string | null = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/products.json?limit=250`;

    while (nextPageUrl) {
      console.log('Fetching products...');
      const response: Response = await fetch(nextPageUrl, {
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
      const products = data.products || [];
      
      allProducts = allProducts.concat(products);
      console.log(`Fetched ${products.length} products (total: ${allProducts.length})`);

      // Check for next page in Link header
      const linkHeader: string | null = response.headers.get('Link');
      nextPageUrl = null;
      
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
    }

    console.log(`Total products to sync: ${allProducts.length}`);

    // Start sync in background and return immediately
    const syncPromise = (async () => {
      let syncedProducts = 0;
      let syncedImages = 0;
      let syncedVariants = 0;
      const errors: string[] = [];

      // Sync each product
    for (const shopifyProduct of allProducts) {
      try {
        // Extract short description from body_html (first 200 chars without HTML)
        const shortDescription = shopifyProduct.body_html
          ? shopifyProduct.body_html.replace(/<[^>]*>/g, '').substring(0, 200)
          : null;

        // Get the base price from the first variant
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
            vendor: shopifyProduct.vendor,
            product_type: shopifyProduct.product_type,
            tags: shopifyProduct.tags,
            shopify_created_at: shopifyProduct.created_at,
            shopify_updated_at: shopifyProduct.updated_at,
            published_at: shopifyProduct.published_at,
          }, {
            onConflict: 'shopify_product_id',
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (productError) {
          errors.push(`Product ${shopifyProduct.title}: ${productError.message}`);
          console.error('Product sync error:', productError);
          continue;
        }

        syncedProducts++;
        console.log(`Synced product: ${product.name} (${product.id})`);

        // Delete existing images for this product
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', product.id);

        // Sync product images
        for (const image of shopifyProduct.images) {
          const { error: imageError } = await supabase
            .from('product_images')
            .insert({
              product_id: product.id,
              image_url: image.src,
              alt_text: image.alt || shopifyProduct.title,
              is_primary: image.position === 1,
              display_order: image.position,
              shopify_image_id: image.id.toString(),
              variant_ids: image.variant_ids || [],
            });

          if (imageError) {
            errors.push(`Image for ${shopifyProduct.title}: ${imageError.message}`);
            console.error('Image sync error:', imageError);
          } else {
            syncedImages++;
          }
        }

        // Delete existing variants for this product
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', product.id);

        // Sync product variants
        for (const variant of shopifyProduct.variants) {
          const { error: variantError } = await supabase
            .from('product_variants')
            .insert({
              product_id: product.id,
              shopify_variant_id: variant.id.toString(),
              name: variant.title,
              price: parseFloat(variant.price),
              compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
              sku: variant.sku,
              stock_quantity: variant.inventory_quantity,
              weight: variant.weight,
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
              barcode: variant.barcode,
            });

          if (variantError) {
            errors.push(`Variant ${variant.title} for ${shopifyProduct.title}: ${variantError.message}`);
            console.error('Variant sync error:', variantError);
          } else {
            syncedVariants++;
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Product ${shopifyProduct.title}: ${errorMessage}`);
        console.error(`Error syncing product ${shopifyProduct.title}:`, error);
      }
    }

      console.log('Sync completed!');
      console.log(`Products synced: ${syncedProducts}`);
      console.log(`Images synced: ${syncedImages}`);
      console.log(`Variants synced: ${syncedVariants}`);
      console.log(`Errors: ${errors.length}`);
      console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

      return {
        syncedProducts,
        syncedImages,
        syncedVariants,
        errorsCount: errors.length,
      };
    })();

    // Wait for sync to complete
    const result = await syncPromise;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${result.syncedProducts} products from Shopify`,
        stats: {
          totalProducts: allProducts.length,
          syncedProducts: result.syncedProducts,
          syncedImages: result.syncedImages,
          syncedVariants: result.syncedVariants,
          errors: result.errorsCount,
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
        message: 'Failed to sync Shopify products',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

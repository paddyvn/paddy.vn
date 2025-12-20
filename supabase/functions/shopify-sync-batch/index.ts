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
  options: Array<{
    id: number;
    name: string;
    position: number;
    values: string[];
  }>;
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
  seo?: {
    title: string | null;
    description: string | null;
  };
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

    // Verify user has admin role using service role client
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

        // Extract option names from Shopify options array
        const option1Name = shopifyProduct.options?.[0]?.name || null;
        const option2Name = shopifyProduct.options?.[1]?.name || null;
        const option3Name = shopifyProduct.options?.[2]?.name || null;

        // Extract SEO fields
        const metaTitle = shopifyProduct.seo?.title || null;
        const metaDescription = shopifyProduct.seo?.description || null;

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
            brand: shopifyProduct.vendor,
            product_type: shopifyProduct.product_type,
            tags: shopifyProduct.tags,
            shopify_created_at: shopifyProduct.created_at,
            shopify_updated_at: shopifyProduct.updated_at,
            published_at: shopifyProduct.published_at,
            option1_name: option1Name,
            option2_name: option2Name,
            option3_name: option3Name,
            meta_title: metaTitle,
            meta_description: metaDescription,
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
              shopify_image_id: image.id.toString(),
              variant_ids: image.variant_ids || [],
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
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
              barcode: variant.barcode,
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const SHOPIFY_ADMIN_API_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');

    console.log('Testing Shopify connection...');
    console.log('Store domain:', SHOPIFY_STORE_DOMAIN);

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_TOKEN) {
      throw new Error('Missing Shopify credentials');
    }

    // Test 1: Fetch products
    console.log('Fetching products from Shopify...');
    const productsResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/products.json?limit=5`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Shopify API error:', errorText);
      throw new Error(`Shopify API returned ${productsResponse.status}: ${errorText}`);
    }

    const productsData = await productsResponse.json();
    console.log(`Successfully fetched ${productsData.products?.length || 0} products`);

    // Test 2: Fetch shop info
    console.log('Fetching shop info...');
    const shopResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    const shopData = shopResponse.ok ? await shopResponse.json() : null;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shopify API connection verified successfully!',
        data: {
          productsCount: productsData.products?.length || 0,
          products: productsData.products?.map((p: any) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            variants_count: p.variants?.length || 0,
          })),
          shop: shopData?.shop ? {
            name: shopData.shop.name,
            email: shopData.shop.email,
            domain: shopData.shop.domain,
            currency: shopData.shop.currency,
          } : null,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error testing Shopify connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: 'Failed to connect to Shopify. Please check your API credentials.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

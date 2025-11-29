import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyCollect {
  id: number;
  collection_id: number;
  product_id: number;
  position: number;
}

interface ShopifyProduct {
  id: number;
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

    console.log('Starting product-collection relationships sync...');

    // Step 1: Fetch all collections from Supabase to build ID mappings
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, shopify_collection_id, collection_type, name');

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    if (!categories || categories.length === 0) {
      throw new Error('No collections found. Please sync collections first.');
    }

    // Build mapping: Shopify collection ID -> Supabase category UUID
    const collectionIdMap = new Map<string, { id: string; type: string; name: string }>();
    categories.forEach(cat => {
      if (cat.shopify_collection_id) {
        collectionIdMap.set(cat.shopify_collection_id, {
          id: cat.id,
          type: cat.collection_type || 'custom',
          name: cat.name,
        });
      }
    });

    console.log(`Found ${collectionIdMap.size} collections with Shopify IDs`);

    // Step 2: Fetch all products from Supabase to build ID mappings
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, shopify_product_id, name');

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      throw new Error('No products found. Please sync products first.');
    }

    // Build mapping: Shopify product ID -> Supabase product UUID
    const productIdMap = new Map<string, { id: string; name: string }>();
    products.forEach(prod => {
      if (prod.shopify_product_id) {
        productIdMap.set(prod.shopify_product_id, {
          id: prod.id,
          name: prod.name,
        });
      }
    });

    console.log(`Found ${productIdMap.size} products with Shopify IDs`);

    const allRelationships: Array<{
      product_id: string;
      collection_id: string;
      position: number;
    }> = [];

    // Step 3: Fetch collects (custom collection relationships) from Shopify
    console.log('Fetching custom collection relationships...');
    let collectsUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/collects.json?limit=250`;
    let customRelationshipsCount = 0;

    while (collectsUrl) {
      const collectsResponse = await fetch(collectsUrl, {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
      });

      if (!collectsResponse.ok) {
        const errorText = await collectsResponse.text();
        throw new Error(`Shopify API error (collects): ${collectsResponse.status} - ${errorText}`);
      }

      const collectsData = await collectsResponse.json();
      const collects: ShopifyCollect[] = collectsData.collects || [];

      // Map Shopify IDs to Supabase UUIDs
      for (const collect of collects) {
        const productUuid = productIdMap.get(collect.product_id.toString())?.id;
        const collectionUuid = collectionIdMap.get(collect.collection_id.toString())?.id;

        if (productUuid && collectionUuid) {
          allRelationships.push({
            product_id: productUuid,
            collection_id: collectionUuid,
            position: collect.position || 0,
          });
          customRelationshipsCount++;
        }
      }

      // Check for pagination
      const linkHeader = collectsResponse.headers.get('Link');
      collectsUrl = '';
      if (linkHeader) {
        const nextLinkMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        if (nextLinkMatch) {
          collectsUrl = nextLinkMatch[1];
        }
      }

      console.log(`Processed ${collects.length} collects, total custom relationships: ${customRelationshipsCount}`);
    }

    // Step 4: Fetch smart collection products
    console.log('Fetching smart collection relationships...');
    const smartCollections = Array.from(collectionIdMap.entries())
      .filter(([_, data]) => data.type === 'smart');

    let smartRelationshipsCount = 0;

    for (const [shopifyCollectionId, collectionData] of smartCollections) {
      console.log(`Fetching products for smart collection: ${collectionData.name}`);
      
      let productsUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/collections/${shopifyCollectionId}/products.json?limit=250`;
      let position = 0;

      while (productsUrl) {
        const productsResponse = await fetch(productsUrl, {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
            'Content-Type': 'application/json',
          },
        });

        if (!productsResponse.ok) {
          console.error(`Failed to fetch products for collection ${shopifyCollectionId}`);
          break;
        }

        const productsData = await productsResponse.json();
        const smartProducts: ShopifyProduct[] = productsData.products || [];

        for (const product of smartProducts) {
          const productUuid = productIdMap.get(product.id.toString())?.id;

          if (productUuid) {
            allRelationships.push({
              product_id: productUuid,
              collection_id: collectionData.id,
              position: position++,
            });
            smartRelationshipsCount++;
          }
        }

        // Check for pagination
        const linkHeader = productsResponse.headers.get('Link');
        productsUrl = '';
        if (linkHeader) {
          const nextLinkMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
          if (nextLinkMatch) {
            productsUrl = nextLinkMatch[1];
          }
        }
      }
    }

    console.log(`Total relationships to sync: ${allRelationships.length}`);
    console.log(`Custom: ${customRelationshipsCount}, Smart: ${smartRelationshipsCount}`);

    // Step 5: Clear existing relationships and insert new ones
    console.log('Clearing existing product-collection relationships...');
    const { error: deleteError } = await supabase
      .from('product_collections')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing relationships:', deleteError);
    }

    // Step 6: Insert relationships in batches
    const batchSize = 500;
    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < allRelationships.length; i += batchSize) {
      const batch = allRelationships.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from('product_collections')
        .insert(batch);

      if (insertError) {
        errors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
        console.error('Batch insert error:', insertError);
      } else {
        insertedCount += batch.length;
      }

      console.log(`Inserted batch ${i / batchSize + 1}, total: ${insertedCount}`);
    }

    console.log('Product-collection sync completed!');
    console.log(`Relationships synced: ${insertedCount}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${insertedCount} product-collection relationships`,
        stats: {
          totalRelationships: allRelationships.length,
          customRelationships: customRelationshipsCount,
          smartRelationships: smartRelationshipsCount,
          insertedCount,
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
        message: 'Failed to sync product-collection relationships',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

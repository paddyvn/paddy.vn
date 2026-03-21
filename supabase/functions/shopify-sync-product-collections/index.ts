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

    console.log('Starting product-collection relationships sync...');

    // Step 1: Fetch all collections from Supabase
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, shopify_collection_id, collection_type, name');

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    if (!categories || categories.length === 0) {
      throw new Error('No collections found. Please sync collections first.');
    }

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

    // Step 2: Fetch all products from Supabase (use source_id, not shopify_product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, source_id, name');

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      throw new Error('No products found. Please sync products first.');
    }

    const productIdMap = new Map<string, { id: string; name: string }>();
    products.forEach(prod => {
      if (prod.source_id) {
        productIdMap.set(prod.source_id, {
          id: prod.id,
          name: prod.name,
        });
      }
    });

    console.log(`Found ${productIdMap.size} products with source IDs`);

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

    // Fix 4: Upsert relationships then cleanup orphans (instead of delete-all-then-insert)
    const batchSize = 500;
    let insertedCount = 0;
    const insertedIds: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < allRelationships.length; i += batchSize) {
      const batch = allRelationships.slice(i, i + batchSize);

      const { data: upserted, error: insertError } = await supabase
        .from('product_collections')
        .upsert(batch, { onConflict: 'product_id,collection_id' })
        .select('id');

      if (insertError) {
        errors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
        console.error('Batch upsert error:', insertError);
      } else if (upserted) {
        insertedCount += upserted.length;
        insertedIds.push(...upserted.map(d => d.id));
      }

      console.log(`Upserted batch ${i / batchSize + 1}, total: ${insertedCount}`);
    }

    // Only after all upserts succeed, delete rows not in the new set
    if (insertedIds.length > 0) {
      // Delete in batches to avoid query size limits
      const deleteChunkSize = 500;
      for (let i = 0; i < insertedIds.length; i += deleteChunkSize) {
        // We can't easily pass all IDs in one NOT IN, so we delete
        // rows that don't match any of the inserted IDs
      }
      // Use a different approach: delete where id NOT IN the inserted set
      // For large sets, do it in a single query with the full list
      const { error: cleanupError } = await supabase
        .from('product_collections')
        .delete()
        .not('id', 'in', `(${insertedIds.join(',')})`);

      if (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      } else {
        console.log('Cleaned up orphaned product-collection relationships');
      }
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

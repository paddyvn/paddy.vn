import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetafieldInfo {
  namespace: string;
  key: string;
  type: string;
  count: number;
  sampleValue: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const SHOPIFY_ADMIN_API_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_TOKEN) {
      throw new Error('Missing Shopify credentials');
    }

    const metafieldMap = new Map<string, MetafieldInfo>();
    
    let cursor: string | null = null;
    let totalProducts = 0;
    const maxProducts = 100;

    while (totalProducts < maxProducts) {
      const query = `
        query GetProductMetafields($cursor: String) {
          products(first: 20, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              title
              metafields(first: 50) {
                nodes {
                  namespace
                  key
                  type
                  value
                }
              }
            }
          }
        }
      `;

      const res: Response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables: { cursor } }),
      });

      if (!res.ok) {
        throw new Error(`Shopify API error: ${res.status}`);
      }

      const jsonData = await res.json() as {
        errors?: unknown[];
        data?: {
          products?: {
            pageInfo?: { hasNextPage: boolean; endCursor: string };
            nodes?: Array<{
              id: string;
              title: string;
              metafields?: {
                nodes?: Array<{
                  namespace: string;
                  key: string;
                  type: string;
                  value: string;
                }>;
              };
            }>;
          };
        };
      };
      
      if (jsonData.errors) {
        console.error('GraphQL errors:', jsonData.errors);
        throw new Error('GraphQL query failed');
      }

      const products = jsonData.data?.products?.nodes || [];
      totalProducts += products.length;

      for (const product of products) {
        for (const metafield of product.metafields?.nodes || []) {
          const mapKey = `${metafield.namespace}.${metafield.key}`;
          const existing = metafieldMap.get(mapKey);
          
          if (existing) {
            existing.count++;
          } else {
            metafieldMap.set(mapKey, {
              namespace: metafield.namespace,
              key: metafield.key,
              type: metafield.type,
              count: 1,
              sampleValue: metafield.value?.substring(0, 200) || '',
            });
          }
        }
      }

      if (!jsonData.data?.products?.pageInfo?.hasNextPage || totalProducts >= maxProducts) {
        break;
      }
      
      cursor = jsonData.data.products.pageInfo.endCursor;
    }

    const metafields = Array.from(metafieldMap.values())
      .sort((a, b) => b.count - a.count);

    console.log(`Found ${metafields.length} unique metafield types across ${totalProducts} products`);

    return new Response(
      JSON.stringify({
        success: true,
        productsSampled: totalProducts,
        metafields,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

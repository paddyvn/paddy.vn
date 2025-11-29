import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyPage {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  author: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  template_suffix: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Shopify pages sync...');

    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!shopifyDomain || !shopifyToken) {
      throw new Error('Missing Shopify credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all pages from Shopify
    let allPages: ShopifyPage[] = [];
    let hasNextPage = true;
    let pageInfo: string | null = null;

    while (hasNextPage) {
      const url: string = pageInfo
        ? `https://${shopifyDomain}/admin/api/2024-01/pages.json?limit=250&page_info=${pageInfo}`
        : `https://${shopifyDomain}/admin/api/2024-01/pages.json?limit=250`;

      console.log(`Fetching pages from: ${url}`);

      const response: Response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Shopify API error:', errorText);
        throw new Error(`Shopify API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const pages = data.pages || [];
      allPages = allPages.concat(pages);

      console.log(`Fetched ${pages.length} pages. Total so far: ${allPages.length}`);

      // Check for pagination
      const linkHeader: string | null = response.headers.get('Link');
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/);
        pageInfo = nextMatch ? nextMatch[1] : null;
        hasNextPage = !!pageInfo;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`Total pages fetched from Shopify: ${allPages.length}`);

    // Sync pages to Supabase
    let syncedCount = 0;
    let errorCount = 0;

    for (const page of allPages) {
      try {
        const pageData = {
          shopify_page_id: page.id.toString(),
          title: page.title,
          handle: page.handle,
          body_html: page.body_html || '',
          author: page.author || '',
          published: !!page.published_at,
          template_suffix: page.template_suffix,
          shopify_created_at: page.created_at,
          shopify_updated_at: page.updated_at,
        };

        const { error } = await supabase
          .from('pages')
          .upsert(pageData, {
            onConflict: 'shopify_page_id',
          });

        if (error) {
          console.error(`Error syncing page ${page.title}:`, error);
          errorCount++;
        } else {
          syncedCount++;
        }
      } catch (error) {
        console.error(`Exception syncing page ${page.title}:`, error);
        errorCount++;
      }
    }

    console.log(`Sync complete. Synced: ${syncedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${syncedCount} pages`,
        total: allPages.length,
        synced: syncedCount,
        errors: errorCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in pages sync:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
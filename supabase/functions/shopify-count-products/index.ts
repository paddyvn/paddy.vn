import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');

    // Get total count
    const countRes = await fetch(
      `https://${shopifyDomain}/admin/api/2024-01/products/count.json`,
      { headers: { 'X-Shopify-Access-Token': shopifyToken! } }
    );
    const countData = await countRes.json();

    // Get active count
    const activeRes = await fetch(
      `https://${shopifyDomain}/admin/api/2024-01/products/count.json?status=active`,
      { headers: { 'X-Shopify-Access-Token': shopifyToken! } }
    );
    const activeData = await activeRes.json();

    // Get draft count
    const draftRes = await fetch(
      `https://${shopifyDomain}/admin/api/2024-01/products/count.json?status=draft`,
      { headers: { 'X-Shopify-Access-Token': shopifyToken! } }
    );
    const draftData = await draftRes.json();

    return new Response(JSON.stringify({
      shopify: {
        total: countData.count,
        active: activeData.count,
        draft: draftData.count,
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

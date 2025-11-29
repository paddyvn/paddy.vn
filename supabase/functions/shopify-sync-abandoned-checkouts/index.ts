import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShopifyCheckout {
  id: number;
  token: string;
  cart_token: string;
  email: string;
  phone: string | null;
  customer: {
    id: number;
    email: string;
    phone: string | null;
  } | null;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    variant_id: number;
    variant_title: string | null;
  }>;
  subtotal_price: string;
  total_price: string;
  currency: string;
  billing_address: any;
  shipping_address: any;
  abandoned_checkout_url: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const shopifyDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN")!;
    const shopifyToken = Deno.env.get("SHOPIFY_ADMIN_API_TOKEN")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { continueFrom, createdAtMin } = await req.json();

    // Build Shopify API URL
    let url = `https://${shopifyDomain}/admin/api/2024-01/checkouts.json?limit=250&status=open`;
    
    if (continueFrom) {
      url += `&since_id=${continueFrom}`;
    }
    
    if (createdAtMin) {
      url += `&created_at_min=${createdAtMin}`;
    }

    console.log(`Fetching abandoned checkouts from: ${url}`);

    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": shopifyToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error: ${response.status} - ${errorText}`);
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    const checkouts: ShopifyCheckout[] = data.checkouts || [];

    console.log(`Received ${checkouts.length} abandoned checkouts from Shopify`);

    // Sync checkouts to database
    let syncedCount = 0;
    for (const checkout of checkouts) {
      try {
        // Find customer in our database by email
        let customerId = null;
        if (checkout.email) {
          const { data: customer } = await supabase
            .from("customers")
            .select("id")
            .eq("email", checkout.email)
            .single();
          
          if (customer) {
            customerId = customer.id;
          }
        }

        const { error } = await supabase.from("abandoned_checkouts").upsert(
          {
            shopify_checkout_id: checkout.id.toString(),
            email: checkout.email,
            phone: checkout.phone,
            customer_id: customerId,
            cart_token: checkout.cart_token,
            abandoned_checkout_url: checkout.abandoned_checkout_url,
            line_items: checkout.line_items,
            subtotal_price: parseFloat(checkout.subtotal_price),
            total_price: parseFloat(checkout.total_price),
            currency: checkout.currency,
            billing_address: checkout.billing_address,
            shipping_address: checkout.shipping_address,
            completed_at: checkout.completed_at,
            shopify_created_at: checkout.created_at,
            shopify_updated_at: checkout.updated_at,
          },
          { onConflict: "shopify_checkout_id" }
        );

        if (error) {
          console.error(`Error syncing checkout ${checkout.id}:`, error);
        } else {
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error processing checkout ${checkout.id}:`, error);
      }
    }

    // Check if there are more checkouts to fetch
    const linkHeader = response.headers.get("Link");
    let hasMore = false;
    let nextContinueFrom = null;

    if (linkHeader && linkHeader.includes('rel="next"')) {
      hasMore = true;
      // Extract the next page_info from the Link header
      const match = linkHeader.match(/since_id=(\d+)/);
      if (match) {
        nextContinueFrom = match[1];
      } else if (checkouts.length > 0) {
        nextContinueFrom = checkouts[checkouts.length - 1].id.toString();
      }
    }

    console.log(`Synced ${syncedCount} abandoned checkouts. Has more: ${hasMore}`);

    return new Response(
      JSON.stringify({
        success: true,
        hasMore,
        continueFrom: nextContinueFrom,
        stats: {
          syncedCheckouts: syncedCount,
          totalReceived: checkouts.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in abandoned checkouts sync:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

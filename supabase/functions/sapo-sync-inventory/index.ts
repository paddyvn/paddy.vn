import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SapoVariant {
  id: number;
  sku: string | null;
  inventories: Array<{
    location_id: number;
    available: number;
    on_hand: number;
  }>;
}

interface SapoProduct {
  id: number;
  name: string;
  variants: SapoVariant[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const sapoStoreUrl = Deno.env.get("SAPO_STORE_URL");
    const sapoAccessToken = Deno.env.get("SAPO_ACCESS_TOKEN");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!sapoStoreUrl || !sapoAccessToken) {
      throw new Error("Missing Sapo API configuration");
    }
    // Normalize the store URL - trim whitespace, remove trailing slashes and /admin suffix
    const baseUrl = sapoStoreUrl.trim().replace(/\/+$/, "").replace(/\/admin$/, "");
    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { batchSize = 50, page = 1 } = await req.json().catch(() => ({}));

    console.log(`Starting Sapo inventory sync - page ${page}, batchSize ${batchSize}`);

    // Fetch products from Sapo with inventory data
    // Sapo API uses /admin/products.json endpoint
    const sapoUrl = `${baseUrl}/admin/products.json?limit=${batchSize}&page=${page}`;
    console.log("Fetching from Sapo:", sapoUrl);

    const sapoResponse = await fetch(sapoUrl, {
      headers: {
        "X-Sapo-Access-Token": sapoAccessToken,
        "Content-Type": "application/json",
      },
    });

    if (!sapoResponse.ok) {
      const errorText = await sapoResponse.text();
      console.error("Sapo API error:", sapoResponse.status, errorText);
      throw new Error(`Sapo API error: ${sapoResponse.status}`);
    }

    const sapoData = await sapoResponse.json();
    const products: SapoProduct[] = sapoData.products || [];

    console.log(`Fetched ${products.length} products from Sapo`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Build a map of SKU -> stock quantity from Sapo
    const skuInventoryMap = new Map<string, number>();
    
    for (const product of products) {
      for (const variant of product.variants || []) {
        if (variant.sku) {
          // Sum up available inventory across all locations
          const totalAvailable = (variant.inventories || []).reduce(
            (sum, inv) => sum + (inv.available || 0),
            0
          );
          skuInventoryMap.set(variant.sku, totalAvailable);
        }
      }
    }

    console.log(`Found ${skuInventoryMap.size} SKUs with inventory data`);

    // Get all product_variants with matching SKUs
    const skus = Array.from(skuInventoryMap.keys());
    
    if (skus.length > 0) {
      // Fetch variants in batches to avoid query limits
      const batchSkus = [];
      for (let i = 0; i < skus.length; i += 100) {
        batchSkus.push(skus.slice(i, i + 100));
      }

      for (const skuBatch of batchSkus) {
        const { data: variants, error: fetchError } = await supabase
          .from("product_variants")
          .select("id, sku, stock_quantity")
          .in("sku", skuBatch);

        if (fetchError) {
          console.error("Error fetching variants:", fetchError);
          errors.push(`Fetch error: ${fetchError.message}`);
          errorCount++;
          continue;
        }

        // Update each variant's stock quantity
        for (const variant of variants || []) {
          if (!variant.sku) continue;

          const newStock = skuInventoryMap.get(variant.sku);
          if (newStock === undefined) {
            skippedCount++;
            continue;
          }

          // Only update if stock changed
          if (variant.stock_quantity === newStock) {
            skippedCount++;
            continue;
          }

          const { error: updateError } = await supabase
            .from("product_variants")
            .update({ 
              stock_quantity: newStock,
              updated_at: new Date().toISOString()
            })
            .eq("id", variant.id);

          if (updateError) {
            console.error(`Error updating variant ${variant.id}:`, updateError);
            errors.push(`Update error for SKU ${variant.sku}: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`Updated SKU ${variant.sku}: ${variant.stock_quantity} -> ${newStock}`);
            updatedCount++;
          }
        }
      }
    }

    // Check if there are more pages
    const hasMore = products.length === batchSize;

    console.log(`Sync complete: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          productsProcessed: products.length,
          skusFound: skuInventoryMap.size,
          updated: updatedCount,
          skipped: skippedCount,
          errors: errorCount,
        },
        hasMore,
        nextPage: hasMore ? page + 1 : null,
        errorDetails: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sapo inventory sync error:", error);
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

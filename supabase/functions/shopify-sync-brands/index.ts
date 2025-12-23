import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyCollection {
  id: number;
  title: string;
  handle: string;
  body_html?: string;
  image?: {
    src: string;
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
    console.log('Starting brands sync from Shopify collections...');

    // Fetch categories that are brand type collections
    const { data: brandCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, shopify_collection_id')
      .eq('collection_type', 'brand');

    if (categoriesError) {
      throw new Error(`Failed to fetch brand categories: ${categoriesError.message}`);
    }

    console.log(`Found ${brandCategories?.length || 0} brand-type collections`);

    let syncedBrands = 0;
    let updatedBrands = 0;
    const errors: string[] = [];

    // Sync each brand category to the brands table
    for (const category of brandCategories || []) {
      try {
        // Check if brand already exists by slug
        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id')
          .eq('slug', category.slug)
          .maybeSingle();

        const brandData = {
          name: category.name,
          slug: category.slug,
          description: category.description,
          logo_url: category.image_url,
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        if (existingBrand) {
          // Update existing brand
          const { error: updateError } = await supabase
            .from('brands')
            .update(brandData)
            .eq('id', existingBrand.id);

          if (updateError) {
            errors.push(`Update ${category.name}: ${updateError.message}`);
          } else {
            updatedBrands++;
          }
        } else {
          // Insert new brand
          const { error: insertError } = await supabase
            .from('brands')
            .insert({
              ...brandData,
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            errors.push(`Insert ${category.name}: ${insertError.message}`);
          } else {
            syncedBrands++;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${category.name}: ${errorMessage}`);
      }
    }

    console.log('Brands sync completed!');
    console.log(`New brands: ${syncedBrands}, Updated: ${updatedBrands}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${syncedBrands + updatedBrands} brands`,
        stats: {
          totalBrandCategories: brandCategories?.length || 0,
          newBrands: syncedBrands,
          updatedBrands,
          errors: errors.length,
          errorDetails: errors.slice(0, 10), // Limit error details
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
        message: 'Failed to sync brands',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

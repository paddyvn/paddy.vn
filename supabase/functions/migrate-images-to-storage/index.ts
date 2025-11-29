import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting image migration to Supabase Storage...');

    const stats: MigrationStats = {
      total: 0,
      migrated: 0,
      failed: 0,
      skipped: 0,
    };

    // Migrate collection images
    console.log('Migrating collection images...');
    const { data: collections } = await supabase
      .from('categories')
      .select('id, name, image_url')
      .not('image_url', 'is', null)
      .like('image_url', '%cdn.shopify.com%');

    if (collections) {
      stats.total += collections.length;
      
      for (const collection of collections) {
        try {
          const newUrl = await migrateImage(
            supabase,
            collection.image_url!,
            `collections/${collection.id}`,
            collection.name
          );

          if (newUrl) {
            const { error } = await supabase
              .from('categories')
              .update({ image_url: newUrl })
              .eq('id', collection.id);

            if (error) throw error;
            
            stats.migrated++;
            console.log(`Migrated collection image: ${collection.name}`);
          } else {
            stats.skipped++;
          }
        } catch (error) {
          stats.failed++;
          console.error(`Failed to migrate collection ${collection.name}:`, error);
        }
      }
    }

    // Migrate product images
    console.log('Migrating product images...');
    const { data: productImages } = await supabase
      .from('product_images')
      .select('id, product_id, image_url, alt_text')
      .not('image_url', 'is', null)
      .like('image_url', '%cdn.shopify.com%');

    if (productImages) {
      stats.total += productImages.length;

      for (const image of productImages) {
        try {
          const newUrl = await migrateImage(
            supabase,
            image.image_url,
            `products/${image.product_id}/${image.id}`,
            image.alt_text || 'product-image'
          );

          if (newUrl) {
            const { error } = await supabase
              .from('product_images')
              .update({ image_url: newUrl })
              .eq('id', image.id);

            if (error) throw error;
            
            stats.migrated++;
            console.log(`Migrated product image: ${image.id}`);
          } else {
            stats.skipped++;
          }
        } catch (error) {
          stats.failed++;
          console.error(`Failed to migrate product image ${image.id}:`, error);
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('Image migration completed!');
    console.log(`Total: ${stats.total}, Migrated: ${stats.migrated}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);
    console.log(`Duration: ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully migrated ${stats.migrated} images`,
        stats: {
          ...stats,
          duration: `${duration}s`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: 'Failed to migrate images',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function migrateImage(
  supabase: any,
  imageUrl: string,
  storagePath: string,
  imageName: string
): Promise<string | null> {
  try {
    // Download image from Shopify CDN
    console.log(`Downloading: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.statusText}`);
      return null;
    }

    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);

    // Determine file extension from URL or content type
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    let extension = 'jpg';
    
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('gif')) extension = 'gif';
    else if (contentType.includes('avif')) extension = 'avif';

    // Generate filename
    const sanitizedName = imageName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    const filename = `${storagePath}/${sanitizedName}.${extension}`;

    // Upload to Supabase Storage
    console.log(`Uploading to: ${filename}`);
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filename, imageData, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename);

    console.log(`Uploaded successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error migrating image:', error);
    return null;
  }
}

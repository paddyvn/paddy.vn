-- Add missing columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_type text,
ADD COLUMN IF NOT EXISTS tags text,
ADD COLUMN IF NOT EXISTS shopify_created_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS shopify_updated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Add missing columns to product_variants table
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS option1 text,
ADD COLUMN IF NOT EXISTS option2 text,
ADD COLUMN IF NOT EXISTS option3 text,
ADD COLUMN IF NOT EXISTS barcode text;

-- Add missing columns to product_images table
ALTER TABLE product_images
ADD COLUMN IF NOT EXISTS shopify_image_id text,
ADD COLUMN IF NOT EXISTS variant_ids jsonb DEFAULT '[]'::jsonb;

-- Create index on product_type for filtering
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);

-- Create index on tags for search
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(to_tsvector('english', tags));

-- Create index on shopify_image_id for image lookups
CREATE INDEX IF NOT EXISTS idx_product_images_shopify_image_id ON product_images(shopify_image_id);
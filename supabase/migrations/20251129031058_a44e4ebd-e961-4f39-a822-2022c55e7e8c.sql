-- Add unique constraint to shopify_product_id in products table
ALTER TABLE products ADD CONSTRAINT products_shopify_product_id_unique UNIQUE (shopify_product_id);

-- Add unique constraint to shopify_variant_id in product_variants table
ALTER TABLE product_variants ADD CONSTRAINT product_variants_shopify_variant_id_unique UNIQUE (shopify_variant_id);

-- Create index on shopify_product_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON products(shopify_product_id);

-- Create index on shopify_variant_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_shopify_id ON product_variants(shopify_variant_id);
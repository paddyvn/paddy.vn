-- Drop the unique constraint on SKU since multiple variants can have null/empty SKUs
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_sku_key;

-- Create a partial unique index that only enforces uniqueness for non-null, non-empty SKUs
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_unique_idx 
ON product_variants (sku) 
WHERE sku IS NOT NULL AND sku != '';
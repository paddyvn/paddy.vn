-- Add discount settings fields to promotion_products table
ALTER TABLE public.promotion_products
ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_limit integer,
ADD COLUMN IF NOT EXISTS purchase_limit integer,
ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true;

-- Create index for variant_id
CREATE INDEX IF NOT EXISTS idx_promotion_products_variant_id ON public.promotion_products(variant_id);

-- Drop the existing unique constraint properly
ALTER TABLE public.promotion_products DROP CONSTRAINT IF EXISTS promotion_products_promotion_id_product_id_key;

-- Create new unique index that allows same product with different variants
CREATE UNIQUE INDEX IF NOT EXISTS promotion_products_unique_promo_product_variant 
ON public.promotion_products(promotion_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
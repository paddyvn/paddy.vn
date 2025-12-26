-- Add voucher-specific columns to promotions table
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS voucher_code TEXT,
ADD COLUMN IF NOT EXISTS voucher_type TEXT DEFAULT 'shop_wide',
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_order_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_discount NUMERIC,
ADD COLUMN IF NOT EXISTS usage_limit INTEGER,
ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_limit_per_customer INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS display_visibility TEXT DEFAULT 'public';

-- Create index for voucher code lookup
CREATE INDEX IF NOT EXISTS idx_promotions_voucher_code ON public.promotions(voucher_code) WHERE voucher_code IS NOT NULL;
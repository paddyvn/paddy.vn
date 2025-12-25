-- Add program_kind column to distinguish promotion types
ALTER TABLE public.promotions 
ADD COLUMN program_kind TEXT DEFAULT 'discount';

-- Add check constraint for valid program_kind values
ALTER TABLE public.promotions
ADD CONSTRAINT promotions_program_kind_check 
CHECK (program_kind IN ('discount', 'combo_buy', 'voucher', 'buy_more_save_more', 'free_shipping', 'subscription_deal', 'flash_sale', 'clearance'));

-- Backfill existing records based on promo_type
UPDATE public.promotions SET program_kind = 'flash_sale' WHERE promo_type = 'flash_sale';
UPDATE public.promotions SET program_kind = 'clearance' WHERE promo_type = 'clearance';
-- For 'deal' type, default to 'discount' (already set by default)
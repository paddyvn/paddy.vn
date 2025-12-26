-- Drop and recreate the check constraint to include 'vouchers'
ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_promo_type_check;

ALTER TABLE public.promotions ADD CONSTRAINT promotions_promo_type_check 
CHECK (promo_type = ANY (ARRAY['deal', 'flash_sale', 'seasonal', 'clearance', 'vouchers']));
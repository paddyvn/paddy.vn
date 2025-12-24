-- Add missing customer fields from Shopify
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS state text DEFAULT 'enabled',
ADD COLUMN IF NOT EXISTS tax_exempt boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_marketing_consent jsonb DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.customers.state IS 'Customer account state: enabled, disabled, invited, declined';
COMMENT ON COLUMN public.customers.sms_marketing_consent IS 'SMS marketing consent object from Shopify';
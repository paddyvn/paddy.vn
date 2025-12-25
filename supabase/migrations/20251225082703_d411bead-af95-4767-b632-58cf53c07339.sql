-- Add flexible custom_icons JSON column to promotions table
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS custom_icons jsonb DEFAULT '[]'::jsonb;
-- Add columns for custom icon URLs to promotions table
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS top_icon_url text,
ADD COLUMN IF NOT EXISTS bottom_icon_url text;
-- Add icon_type column to promotions table for deal card icon customization
ALTER TABLE public.promotions 
ADD COLUMN icon_type TEXT DEFAULT 'dog_cat';
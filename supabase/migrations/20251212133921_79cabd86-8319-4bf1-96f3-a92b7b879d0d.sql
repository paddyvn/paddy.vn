-- Add rating columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;
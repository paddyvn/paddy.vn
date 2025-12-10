-- Add pet_type column to products table for categorizing by pet (Dog, Cat, etc.)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pet_type text;
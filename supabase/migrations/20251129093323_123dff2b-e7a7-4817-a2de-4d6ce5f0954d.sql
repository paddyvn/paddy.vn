-- Add SEO fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description text;
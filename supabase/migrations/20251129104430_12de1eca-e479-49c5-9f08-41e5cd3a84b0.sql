-- Add SEO fields to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT;
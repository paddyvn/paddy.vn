-- Add product option name columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS option1_name text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS option2_name text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS option3_name text;
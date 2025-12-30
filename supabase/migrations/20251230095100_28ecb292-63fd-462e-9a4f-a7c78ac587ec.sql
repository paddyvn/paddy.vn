-- Add content fields for product detail tabs
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS ingredients text,
ADD COLUMN IF NOT EXISTS feeding_guidelines text,
ADD COLUMN IF NOT EXISTS nutrition_facts jsonb DEFAULT '[]'::jsonb;

-- Add visibility toggles (default to true so existing products show content)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS show_description boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_ingredients boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_feeding_guidelines boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_nutrition_facts boolean DEFAULT true;

-- Add comments for clarity
COMMENT ON COLUMN public.products.ingredients IS 'Product ingredients list (HTML or plain text)';
COMMENT ON COLUMN public.products.feeding_guidelines IS 'Feeding guidelines/instructions (HTML or plain text)';
COMMENT ON COLUMN public.products.nutrition_facts IS 'Nutrition facts as JSON array [{label, value}]';
COMMENT ON COLUMN public.products.show_description IS 'Toggle to show/hide description tab';
COMMENT ON COLUMN public.products.show_ingredients IS 'Toggle to show/hide ingredients tab';
COMMENT ON COLUMN public.products.show_feeding_guidelines IS 'Toggle to show/hide feeding guidelines tab';
COMMENT ON COLUMN public.products.show_nutrition_facts IS 'Toggle to show/hide nutrition facts block';
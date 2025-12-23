-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  country_code TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active brands"
ON public.brands FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage brands"
ON public.brands FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add brand_id foreign key to products
ALTER TABLE public.products ADD COLUMN brand_id UUID REFERENCES public.brands(id);

-- Create index for faster lookups
CREATE INDEX idx_products_brand_id ON public.products(brand_id);
CREATE INDEX idx_brands_slug ON public.brands(slug);

-- Populate brands from existing unique product.brand values (case-insensitive dedup)
INSERT INTO public.brands (name, slug)
SELECT 
  name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
FROM (
  SELECT DISTINCT ON (LOWER(brand)) brand AS name
  FROM public.products
  WHERE brand IS NOT NULL AND TRIM(brand) != ''
  ORDER BY LOWER(brand), brand
) AS unique_brands;

-- Update products to link to the new brands table (case-insensitive match)
UPDATE public.products p
SET brand_id = b.id
FROM public.brands b
WHERE LOWER(p.brand) = LOWER(b.name) AND p.brand IS NOT NULL;
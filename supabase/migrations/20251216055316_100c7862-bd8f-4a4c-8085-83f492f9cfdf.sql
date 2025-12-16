-- Create junction table for promotions to collections
CREATE TABLE public.promotion_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(promotion_id, collection_id)
);

-- Create junction table for promotions to products
CREATE TABLE public.promotion_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(promotion_id, product_id)
);

-- Enable RLS
ALTER TABLE public.promotion_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotion_collections
CREATE POLICY "Admins can manage promotion collections"
ON public.promotion_collections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view promotion collections"
ON public.promotion_collections
FOR SELECT
USING (true);

-- RLS policies for promotion_products
CREATE POLICY "Admins can manage promotion products"
ON public.promotion_products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view promotion products"
ON public.promotion_products
FOR SELECT
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_promotion_collections_promotion_id ON public.promotion_collections(promotion_id);
CREATE INDEX idx_promotion_collections_collection_id ON public.promotion_collections(collection_id);
CREATE INDEX idx_promotion_products_promotion_id ON public.promotion_products(promotion_id);
CREATE INDEX idx_promotion_products_product_id ON public.promotion_products(product_id);
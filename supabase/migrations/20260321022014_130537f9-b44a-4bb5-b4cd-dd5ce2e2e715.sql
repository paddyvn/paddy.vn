
CREATE TABLE public.homepage_featured_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  section_title TEXT NOT NULL DEFAULT 'Sản phẩm nổi bật',
  product_count INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_featured_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read featured config"
ON public.homepage_featured_config FOR SELECT
USING (true);

CREATE POLICY "Admin can manage featured config"
ON public.homepage_featured_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.homepage_featured_config (section_title, product_count, is_active)
VALUES ('Sản phẩm nổi bật', 10, true);

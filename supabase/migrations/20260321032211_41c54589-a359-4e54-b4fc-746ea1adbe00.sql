
CREATE TABLE public.top_nav_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  link_url TEXT,
  mega_menu_id UUID REFERENCES public.navigation_menus(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_top_nav_items_position ON public.top_nav_items (position);

ALTER TABLE public.top_nav_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active top nav items"
ON public.top_nav_items FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage top nav items"
ON public.top_nav_items FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Seed with current nav items
INSERT INTO public.top_nav_items (label, link_url, mega_menu_id, position) VALUES
  ('Chó', NULL, (SELECT id FROM public.navigation_menus WHERE slug = 'dog'), 0),
  ('Mèo', NULL, (SELECT id FROM public.navigation_menus WHERE slug = 'cat'), 1),
  ('Blog chăm Boss', '/blogs', NULL, 2),
  ('Thương hiệu', '/brands', NULL, 3),
  ('Khuyến mãi', '/flash-sale', NULL, 4);


CREATE TABLE public.homepage_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_type TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'toy',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_homepage_categories_pet_active 
ON public.homepage_categories (pet_type, is_active, position);

ALTER TABLE public.homepage_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active homepage categories" 
ON public.homepage_categories FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage homepage categories" 
ON public.homepage_categories FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

INSERT INTO public.homepage_categories (pet_type, name, slug, icon, position) VALUES
  ('dog', 'Thức Ăn Hạt', 'hat-cho-cho', 'dryfood', 0),
  ('dog', 'Pate', 'pate-cho', 'wetfood', 1),
  ('dog', 'Bánh Thưởng', 'banh-thuong-cho-cho', 'treat', 2),
  ('dog', 'Đồ Chơi', 'do-choi-cho-cho', 'toy', 3),
  ('dog', 'Dây Dắt', 'vong-co-day-dat', 'leash', 4),
  ('dog', 'Quần Áo', 'thoi-trang-cho-meo', 'clothing', 5),
  ('dog', 'Nệm & Chuồng', 'nem-chuong-cho', 'bed', 6),
  ('dog', 'Bát & Bình', 'bat-binh-nuoc', 'bowl', 7),
  ('dog', 'Vệ Sinh', 've-sinh-cho', 'hygiene', 8),
  ('dog', 'Sức Khỏe', 'suc-khoe-cho', 'health', 9),
  ('dog', 'Tã & Bỉm', 'ta-bim-cho', 'pad', 10),
  ('dog', 'Khuyến Mãi', 'promotions', 'deals', 11),
  ('cat', 'Thức Ăn Hạt', 'hat-cho-meo', 'dryfood', 0),
  ('cat', 'Pate', 'pate-cho-meo', 'wetfood', 1),
  ('cat', 'Bánh Thưởng', 'banh-thuong-cho-meo', 'treat', 2),
  ('cat', 'Đồ Chơi', 'do-choi-cho-meo', 'toy', 3),
  ('cat', 'Cát Vệ Sinh', 'cat-litter', 'litter', 4),
  ('cat', 'Nhà Mèo', 'cat-trees', 'cattree', 5),
  ('cat', 'Balo Vận Chuyển', 'balo-meo', 'carrier', 6),
  ('cat', 'Bát & Bình', 'bat-binh-nuoc-meo', 'bowl', 7),
  ('cat', 'Vệ Sinh', 've-sinh-meo', 'hygiene', 8),
  ('cat', 'Sức Khỏe', 'suc-khoe-meo', 'health', 9),
  ('cat', 'Quần Áo', 'quan-ao-meo', 'clothing', 10),
  ('cat', 'Khuyến Mãi', 'promotions', 'deals', 11);


CREATE TABLE public.homepage_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  eyebrow TEXT,
  cta_text TEXT NOT NULL DEFAULT 'Mua ngay',
  image_url TEXT,
  bg_color TEXT NOT NULL DEFAULT '#DBEAFE',
  layout_slot TEXT NOT NULL CHECK (layout_slot IN ('hero', 'wide', 'half')),
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active homepage promos"
ON public.homepage_promos FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage homepage promos"
ON public.homepage_promos FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

INSERT INTO public.homepage_promos (title, eyebrow, cta_text, bg_color, layout_slot, link_url, position) VALUES
  ('Sản phẩm mới' || chr(10) || 'cho Boss yêu', 'Thương hiệu mới tại Paddy', 'Khám phá ngay', '#DBEAFE', 'hero', '/collections/san-pham-moi', 0),
  ('Thức ăn hạt' || chr(10) || 'chất lượng cao', 'Giảm đến 30%', 'Mua ngay', '#E0F2FE', 'wide', '/collections/thuc-an-cho-cho', 1),
  ('Set chăm sóc' || chr(10) || 'toàn diện', 'Combo tiết kiệm', 'Mua ngay', '#EDE9FE', 'half', '/collections/combo-tiet-kiem', 2),
  ('Mua 2 tặng 1' || chr(10) || 'đồ chơi Boss', 'Đồ chơi & phụ kiện', 'Mua ngay', '#FCE7F3', 'half', '/collections/do-choi-thu-cung', 3);

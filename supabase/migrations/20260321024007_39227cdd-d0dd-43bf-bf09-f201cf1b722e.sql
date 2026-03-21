CREATE TABLE homepage_featured_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id)
);

CREATE INDEX idx_homepage_featured_brands_position ON homepage_featured_brands (position);

ALTER TABLE homepage_featured_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read homepage featured brands"
ON homepage_featured_brands FOR SELECT USING (true);

CREATE POLICY "Admin can manage homepage featured brands"
ON homepage_featured_brands FOR ALL
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
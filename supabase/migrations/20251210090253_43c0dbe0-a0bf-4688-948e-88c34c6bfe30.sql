-- Create lookup table for age ranges
CREATE TABLE public.product_age_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_vi text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create lookup table for sizes (breed sizes)
CREATE TABLE public.product_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_vi text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create lookup table for health conditions
CREATE TABLE public.product_health_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_vi text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create lookup table for countries/origins
CREATE TABLE public.product_origins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_vi text NOT NULL,
  country_code text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add columns to products table for single-select attributes
ALTER TABLE public.products
ADD COLUMN target_age_id uuid REFERENCES public.product_age_ranges(id),
ADD COLUMN target_size_id uuid REFERENCES public.product_sizes(id),
ADD COLUMN origin_id uuid REFERENCES public.product_origins(id);

-- Create junction table for product health conditions (multi-select)
CREATE TABLE public.product_health_condition_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  health_condition_id uuid NOT NULL REFERENCES public.product_health_conditions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, health_condition_id)
);

-- Enable RLS on all lookup tables
ALTER TABLE public.product_age_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_health_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_health_condition_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for age ranges
CREATE POLICY "Anyone can view active age ranges" ON public.product_age_ranges
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage age ranges" ON public.product_age_ranges
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for sizes
CREATE POLICY "Anyone can view active sizes" ON public.product_sizes
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage sizes" ON public.product_sizes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for health conditions
CREATE POLICY "Anyone can view active health conditions" ON public.product_health_conditions
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage health conditions" ON public.product_health_conditions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for origins
CREATE POLICY "Anyone can view active origins" ON public.product_origins
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage origins" ON public.product_origins
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for health condition links
CREATE POLICY "Anyone can view health condition links" ON public.product_health_condition_links
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage health condition links" ON public.product_health_condition_links
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default age ranges
INSERT INTO public.product_age_ranges (name, name_vi, display_order) VALUES
('All ages', 'Mọi lứa tuổi', 1),
('Under 12 months', 'Dưới 12 tháng tuổi', 2),
('1-7 years', '1-7 tuổi', 3),
('7+ years', '7 tuổi +', 4);

-- Insert default sizes
INSERT INTO public.product_sizes (name, name_vi, display_order) VALUES
('All sizes', 'Mọi giống', 1),
('Small', 'Giống nhỏ', 2),
('Medium', 'Giống vừa', 3),
('Large', 'Giống lớn', 4);

-- Insert default health conditions
INSERT INTO public.product_health_conditions (name, name_vi, display_order) VALUES
('Spayed/Neutered', 'Triệt sản', 1),
('Weight management', 'Cân nặng', 2),
('Urinary', 'Tiết niệu', 3),
('Digestive', 'Tiêu hoá', 4),
('Skin & Coat', 'Lông da', 5),
('Sensitive', 'Nhạy cảm', 6),
('Joint', 'Xương khớp', 7),
('Respiratory', 'Hô hấp', 8),
('Heart', 'Tim mạch', 9),
('Pregnant & Nursing', 'Mang thai & Cho con bú', 10);

-- Insert default origins
INSERT INTO public.product_origins (name, name_vi, country_code, display_order) VALUES
('Vietnam', 'Việt Nam', 'VN', 1),
('USA', 'Mỹ', 'US', 2),
('Japan', 'Nhật Bản', 'JP', 3),
('South Korea', 'Hàn Quốc', 'KR', 4),
('Thailand', 'Thái Lan', 'TH', 5),
('Germany', 'Đức', 'DE', 6),
('France', 'Pháp', 'FR', 7),
('Australia', 'Úc', 'AU', 8),
('New Zealand', 'New Zealand', 'NZ', 9),
('China', 'Trung Quốc', 'CN', 10);
-- Create product_badges table for global badge management
CREATE TABLE public.product_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT,
  icon TEXT NOT NULL, -- lucide icon name (e.g., 'CheckCircle', 'Leaf', 'Truck', 'Award')
  icon_color TEXT NOT NULL DEFAULT '#3b82f6', -- hex color for icon
  bg_color TEXT NOT NULL DEFAULT '#dbeafe', -- hex color for background circle
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table to link badges to products
CREATE TABLE public.product_badge_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.product_badges(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, badge_id)
);

-- Enable RLS on product_badges
ALTER TABLE public.product_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_badges
CREATE POLICY "Admins can manage badges"
ON public.product_badges
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active badges"
ON public.product_badges
FOR SELECT
USING (is_active = true);

-- Enable RLS on product_badge_links
ALTER TABLE public.product_badge_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_badge_links
CREATE POLICY "Admins can manage badge links"
ON public.product_badge_links
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view badge links"
ON public.product_badge_links
FOR SELECT
USING (true);

-- Insert default badges
INSERT INTO public.product_badges (name, name_vi, icon, icon_color, bg_color, display_order) VALUES
('Vet Approved', 'Bác sĩ thú y phê duyệt', 'CheckCircle', '#2563eb', '#dbeafe', 1),
('100% Organic', '100% Hữu cơ', 'Leaf', '#ea580c', '#ffedd5', 2),
('Free 2-Day Shipping', 'Giao hàng miễn phí 2 ngày', 'Truck', '#9333ea', '#f3e8ff', 3),
('Satisfaction Guarantee', 'Đảm bảo hài lòng', 'Award', '#ca8a04', '#fef9c3', 4);

-- Create trigger for updated_at
CREATE TRIGGER update_product_badges_updated_at
BEFORE UPDATE ON public.product_badges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
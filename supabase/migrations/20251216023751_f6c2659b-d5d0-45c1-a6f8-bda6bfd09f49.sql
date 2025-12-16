-- Create promotions table for deals/promo cards
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  gradient_from TEXT DEFAULT '#8B5CF6',
  gradient_to TEXT DEFAULT '#6366F1',
  link_type TEXT NOT NULL DEFAULT 'collection' CHECK (link_type IN ('collection', 'page', 'product', 'external')),
  link_destination TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  promo_type TEXT DEFAULT 'deal' CHECK (promo_type IN ('deal', 'flash_sale', 'seasonal', 'clearance')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Public can view active promotions within date range
CREATE POLICY "Anyone can view active promotions"
ON public.promotions
FOR SELECT
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);

-- Admins can manage promotions
CREATE POLICY "Admins can manage promotions"
ON public.promotions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample promotions based on current DealsGrid
INSERT INTO public.promotions (title, subtitle, gradient_from, gradient_to, link_type, link_destination, display_order) VALUES
('Giảm đến 30%', 'Thức ăn cho chó', '#8B5CF6', '#6366F1', 'collection', 'thuc-an-cho-cho', 1),
('Mua 2 tặng 1', 'Đồ chơi thú cưng', '#EC4899', '#F43F5E', 'collection', 'do-choi-thu-cung', 2),
('Flash Sale', 'Phụ kiện giảm 50%', '#F59E0B', '#EF4444', 'collection', 'phu-kien', 3),
('Combo tiết kiệm', 'Set chăm sóc toàn diện', '#10B981', '#14B8A6', 'collection', 'combo-tiet-kiem', 4);
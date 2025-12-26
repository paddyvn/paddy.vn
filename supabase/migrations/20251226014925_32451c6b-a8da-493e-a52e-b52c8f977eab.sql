-- Create stores table for offline store locations
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  image_url text,
  map_url text,
  phone text,
  opening_hours text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Public can view active stores
CREATE POLICY "Anyone can view active stores"
ON public.stores
FOR SELECT
USING (is_active = true);

-- Admins can manage stores
CREATE POLICY "Admins can manage stores"
ON public.stores
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial store data
INSERT INTO public.stores (name, address, map_url, display_order) VALUES
  ('Paddy Pet Shop - Trường Sa', '168 Trường Sa, P. Gia Định, Tp. HCM (Phường 1, Q. Bình Thạnh cũ)', 'https://maps.google.com/?q=168+Trường+Sa,+Bình+Thạnh,+HCM', 1),
  ('Paddy Pet Shop - Nơ Trang Long', '412/3 Nơ Trang Long, P. Bình Lợi Trung, Tp. HCM (Phường 13, Q.Bình Thạnh cũ)', 'https://maps.google.com/?q=412/3+Nơ+Trang+Long,+Bình+Thạnh,+HCM', 2),
  ('Paddy Pet Shop - Trần Não', '91B Trần Não, P. An Khánh, Tp. HCM (Quận 2 cũ)', 'https://maps.google.com/?q=91B+Trần+Não,+Quận+2,+HCM', 3),
  ('Paddy Pet Shop - Nguyễn Thị Thập', '406 Nguyễn Thị Thập, P. Tân Hưng, Tp. HCM (P. Tân Quy, Q.7 cũ)', 'https://maps.google.com/?q=406+Nguyễn+Thị+Thập,+Quận+7,+HCM', 4);
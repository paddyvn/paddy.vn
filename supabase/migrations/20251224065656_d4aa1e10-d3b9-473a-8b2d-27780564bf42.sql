-- Create delivery_methods table
CREATE TABLE public.delivery_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_methods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage delivery methods"
ON public.delivery_methods
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active delivery methods"
ON public.delivery_methods
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_delivery_methods_updated_at
BEFORE UPDATE ON public.delivery_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default delivery methods
INSERT INTO public.delivery_methods (name, description, price, display_order) VALUES
  ('Giao hàng hỏa tốc', 'Giao trong 2 giờ', 50000, 1),
  ('Giao hàng nhanh', 'Giao trong 24 giờ', 30000, 2);
-- Create table for product option templates (global library of option names)
CREATE TABLE public.product_option_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for predefined option values
CREATE TABLE public.product_option_template_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.product_option_templates(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_id, value)
);

-- Enable RLS
ALTER TABLE public.product_option_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_template_values ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_option_templates
CREATE POLICY "Anyone can view active option templates"
ON public.product_option_templates
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage option templates"
ON public.product_option_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for product_option_template_values
CREATE POLICY "Anyone can view option template values"
ON public.product_option_template_values
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage option template values"
ON public.product_option_template_values
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert common pet store option templates
INSERT INTO public.product_option_templates (name, display_order) VALUES
('Size', 1),
('Weight', 2),
('Flavor', 3),
('Color', 4),
('Package Type', 5),
('Age Group', 6);

-- Insert common values for Size
INSERT INTO public.product_option_template_values (template_id, value, display_order)
SELECT id, unnest(ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL']), generate_series(1, 6)
FROM public.product_option_templates WHERE name = 'Size';

-- Insert common values for Weight
INSERT INTO public.product_option_template_values (template_id, value, display_order)
SELECT id, unnest(ARRAY['100g', '200g', '400g', '500g', '1kg', '2kg', '3kg', '5kg', '10kg', '15kg']), generate_series(1, 10)
FROM public.product_option_templates WHERE name = 'Weight';

-- Insert common values for Flavor
INSERT INTO public.product_option_template_values (template_id, value, display_order)
SELECT id, unnest(ARRAY['Chicken', 'Beef', 'Pork', 'Fish', 'Salmon', 'Tuna', 'Duck', 'Lamb', 'Mixed']), generate_series(1, 9)
FROM public.product_option_templates WHERE name = 'Flavor';

-- Insert common values for Color
INSERT INTO public.product_option_template_values (template_id, value, display_order)
SELECT id, unnest(ARRAY['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Black', 'White', 'Brown', 'Gray']), generate_series(1, 9)
FROM public.product_option_templates WHERE name = 'Color';

-- Insert common values for Package Type
INSERT INTO public.product_option_template_values (template_id, value, display_order)
SELECT id, unnest(ARRAY['Bag', 'Box', 'Can', 'Pouch', 'Bottle', 'Jar']), generate_series(1, 6)
FROM public.product_option_templates WHERE name = 'Package Type';

-- Insert common values for Age Group  
INSERT INTO public.product_option_template_values (template_id, value, display_order)
SELECT id, unnest(ARRAY['Puppy', 'Kitten', 'Adult', 'Senior', 'All Ages']), generate_series(1, 5)
FROM public.product_option_templates WHERE name = 'Age Group';
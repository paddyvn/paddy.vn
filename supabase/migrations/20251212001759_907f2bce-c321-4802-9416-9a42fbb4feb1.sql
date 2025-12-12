-- Create navigation menus table (top-level menus like "Dogs", "Cats")
CREATE TABLE public.navigation_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  promo_image_url TEXT,
  promo_title TEXT,
  promo_badge TEXT,
  promo_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create navigation columns table (columns within each menu)
CREATE TABLE public.navigation_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.navigation_menus(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  shop_all_link TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create navigation items table (individual links within columns)
CREATE TABLE public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.navigation_columns(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  link TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for navigation_menus
CREATE POLICY "Anyone can view active menus" ON public.navigation_menus
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage menus" ON public.navigation_menus
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for navigation_columns
CREATE POLICY "Anyone can view columns" ON public.navigation_columns
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.navigation_menus 
  WHERE id = navigation_columns.menu_id AND is_active = true
));

CREATE POLICY "Admins can manage columns" ON public.navigation_columns
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for navigation_items
CREATE POLICY "Anyone can view items" ON public.navigation_items
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.navigation_columns c
  JOIN public.navigation_menus m ON m.id = c.menu_id
  WHERE c.id = navigation_items.column_id AND m.is_active = true
));

CREATE POLICY "Admins can manage items" ON public.navigation_items
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update triggers
CREATE TRIGGER update_navigation_menus_updated_at
BEFORE UPDATE ON public.navigation_menus
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_navigation_columns_updated_at
BEFORE UPDATE ON public.navigation_columns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_navigation_items_updated_at
BEFORE UPDATE ON public.navigation_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Create blog_categories table
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage blog categories"
ON public.blog_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active blog categories"
ON public.blog_categories
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add category_id to blog_posts (optional reference)
ALTER TABLE public.blog_posts 
ADD COLUMN category_id UUID REFERENCES public.blog_categories(id);

-- Migrate existing blog_title values to categories
INSERT INTO public.blog_categories (name, slug, display_order)
SELECT DISTINCT 
  blog_title,
  lower(regexp_replace(blog_title, '[^a-zA-Z0-9]+', '-', 'g')),
  ROW_NUMBER() OVER (ORDER BY blog_title)
FROM public.blog_posts 
WHERE blog_title IS NOT NULL AND blog_title != ''
ON CONFLICT (slug) DO NOTHING;
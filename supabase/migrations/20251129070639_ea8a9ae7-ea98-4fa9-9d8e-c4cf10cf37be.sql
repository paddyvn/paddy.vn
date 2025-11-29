-- Create pages table for Shopify pages
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_page_id TEXT UNIQUE,
  title TEXT NOT NULL,
  handle TEXT NOT NULL,
  body_html TEXT,
  author TEXT,
  published BOOLEAN DEFAULT true,
  template_suffix TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shopify_created_at TIMESTAMP WITH TIME ZONE,
  shopify_updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create policies for pages
CREATE POLICY "Admins can manage pages"
  ON public.pages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published pages"
  ON public.pages
  FOR SELECT
  USING (published = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_pages_shopify_id ON public.pages(shopify_page_id);
CREATE INDEX idx_pages_handle ON public.pages(handle);
CREATE INDEX idx_pages_published ON public.pages(published);
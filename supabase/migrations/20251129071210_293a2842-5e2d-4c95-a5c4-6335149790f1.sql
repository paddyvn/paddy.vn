-- Create blog_posts table for Shopify blog articles
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_article_id TEXT UNIQUE,
  shopify_blog_id TEXT,
  blog_title TEXT,
  title TEXT NOT NULL,
  handle TEXT NOT NULL,
  body_html TEXT,
  summary_html TEXT,
  author TEXT,
  published BOOLEAN DEFAULT true,
  tags TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shopify_created_at TIMESTAMP WITH TIME ZONE,
  shopify_updated_at TIMESTAMP WITH TIME ZONE,
  shopify_published_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for blog_posts
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts
  FOR SELECT
  USING (published = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_shopify_article_id ON public.blog_posts(shopify_article_id);
CREATE INDEX idx_blog_posts_shopify_blog_id ON public.blog_posts(shopify_blog_id);
CREATE INDEX idx_blog_posts_handle ON public.blog_posts(handle);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published);
CREATE INDEX idx_blog_posts_tags ON public.blog_posts USING gin(to_tsvector('english', tags));
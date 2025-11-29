-- Create abandoned_checkouts table
CREATE TABLE IF NOT EXISTS public.abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_checkout_id TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  customer_id UUID,
  cart_token TEXT,
  abandoned_checkout_url TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  subtotal_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'VND',
  billing_address JSONB,
  shipping_address JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  shopify_created_at TIMESTAMP WITH TIME ZONE,
  shopify_updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Admins can manage abandoned checkouts
CREATE POLICY "Admins can manage abandoned checkouts"
ON public.abandoned_checkouts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_abandoned_checkouts_updated_at
BEFORE UPDATE ON public.abandoned_checkouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_abandoned_checkouts_email ON public.abandoned_checkouts(email);
CREATE INDEX idx_abandoned_checkouts_created_at ON public.abandoned_checkouts(shopify_created_at DESC NULLS LAST, created_at DESC);
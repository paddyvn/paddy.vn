-- Create customers table for Shopify customer data
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_customer_id TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  orders_count INTEGER DEFAULT 0,
  total_spent NUMERIC(15,2) DEFAULT 0,
  accepts_marketing BOOLEAN DEFAULT false,
  marketing_opt_in_level TEXT,
  tags TEXT,
  note TEXT,
  verified_email BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shopify_created_at TIMESTAMP WITH TIME ZONE,
  shopify_updated_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX idx_customers_shopify_id ON public.customers(shopify_customer_id);
CREATE INDEX idx_customers_email ON public.customers(email);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admins can view all customers
CREATE POLICY "Admins can view all customers" 
ON public.customers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage customers
CREATE POLICY "Admins can manage customers" 
ON public.customers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
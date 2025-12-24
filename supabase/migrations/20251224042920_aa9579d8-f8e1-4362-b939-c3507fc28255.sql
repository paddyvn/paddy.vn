-- Add missing columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS financial_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS fulfillment_status text DEFAULT 'unfulfilled',
ADD COLUMN IF NOT EXISTS payment_gateway text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'VND',
ADD COLUMN IF NOT EXISTS tags text,
ADD COLUMN IF NOT EXISTS source_name text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone;

-- Create order_events table for timeline
CREATE TABLE public.order_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shopify_event_id text,
  event_type text NOT NULL,
  message text NOT NULL,
  author text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX idx_order_events_created_at ON public.order_events(created_at);

-- Enable RLS
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_events
CREATE POLICY "Admins can manage order events"
ON public.order_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order events"
ON public.order_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_events.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Create order_fulfillments table for tracking
CREATE TABLE public.order_fulfillments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shopify_fulfillment_id text,
  status text DEFAULT 'pending',
  tracking_number text,
  tracking_url text,
  tracking_company text,
  location_name text,
  shipment_status text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_order_fulfillments_order_id ON public.order_fulfillments(order_id);

-- Enable RLS
ALTER TABLE public.order_fulfillments ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_fulfillments
CREATE POLICY "Admins can manage order fulfillments"
ON public.order_fulfillments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order fulfillments"
ON public.order_fulfillments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_fulfillments.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Add trigger for updated_at on fulfillments
CREATE TRIGGER update_order_fulfillments_updated_at
BEFORE UPDATE ON public.order_fulfillments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
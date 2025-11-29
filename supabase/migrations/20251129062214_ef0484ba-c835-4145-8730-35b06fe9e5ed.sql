-- Create customer_segments table
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

-- Admins can manage segments
CREATE POLICY "Admins can manage segments"
ON public.customer_segments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_customer_segments_updated_at
BEFORE UPDATE ON public.customer_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
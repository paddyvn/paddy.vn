-- Create table for users to save vouchers
CREATE TABLE public.user_saved_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  UNIQUE(user_id, promotion_id)
);

-- Enable RLS
ALTER TABLE public.user_saved_vouchers ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved vouchers
CREATE POLICY "Users can view own saved vouchers"
  ON public.user_saved_vouchers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save vouchers
CREATE POLICY "Users can save vouchers"
  ON public.user_saved_vouchers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved vouchers
CREATE POLICY "Users can delete own saved vouchers"
  ON public.user_saved_vouchers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own saved vouchers (for marking as used)
CREATE POLICY "Users can update own saved vouchers"
  ON public.user_saved_vouchers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_saved_vouchers_user_id ON public.user_saved_vouchers(user_id);
CREATE INDEX idx_user_saved_vouchers_promotion_id ON public.user_saved_vouchers(promotion_id);
-- Add voucher tracking to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id);

-- Atomic increment function for voucher usage
CREATE OR REPLACE FUNCTION increment_voucher_usage(p_promotion_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE promotions
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE id = p_promotion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public';
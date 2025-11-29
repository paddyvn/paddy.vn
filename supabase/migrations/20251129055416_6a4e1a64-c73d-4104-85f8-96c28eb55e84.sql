-- Increase precision for orders table to handle Vietnamese Dong amounts
-- From numeric(10,2) to numeric(15,2) to support up to 9,999,999,999,999.99 VND

ALTER TABLE public.orders
  ALTER COLUMN subtotal TYPE numeric(15,2),
  ALTER COLUMN shipping_fee TYPE numeric(15,2),
  ALTER COLUMN discount TYPE numeric(15,2),
  ALTER COLUMN total TYPE numeric(15,2);

-- Increase precision for order_items table
ALTER TABLE public.order_items
  ALTER COLUMN price TYPE numeric(15,2),
  ALTER COLUMN subtotal TYPE numeric(15,2);

-- Also update product-related tables for consistency
ALTER TABLE public.products
  ALTER COLUMN base_price TYPE numeric(15,2),
  ALTER COLUMN compare_at_price TYPE numeric(15,2);

ALTER TABLE public.product_variants
  ALTER COLUMN price TYPE numeric(15,2),
  ALTER COLUMN compare_at_price TYPE numeric(15,2);
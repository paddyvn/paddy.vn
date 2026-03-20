ALTER TABLE orders ADD COLUMN customer_name TEXT GENERATED ALWAYS AS (
  COALESCE(shipping_address->>'first_name', '') || ' ' || COALESCE(shipping_address->>'last_name', '')
) STORED;
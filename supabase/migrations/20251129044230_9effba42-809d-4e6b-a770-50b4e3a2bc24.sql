-- Add unique constraint on shopify_order_id for proper upserts
ALTER TABLE orders ADD CONSTRAINT orders_shopify_order_id_key UNIQUE (shopify_order_id);
-- Add sold_count column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_count integer DEFAULT 0;

-- Backfill sold_count from order_items
UPDATE public.products p
SET sold_count = sub.total_sold
FROM (
  SELECT product_id, COALESCE(SUM(quantity), 0)::integer AS total_sold
  FROM public.order_items
  WHERE product_id IS NOT NULL
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;
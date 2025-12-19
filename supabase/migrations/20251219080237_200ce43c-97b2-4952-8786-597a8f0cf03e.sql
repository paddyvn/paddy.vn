-- Drop all overly permissive public access policies on SAPO and MISA tables
-- The admin policies already exist, we just need to remove the public ones

-- SAPO Tables
DROP POLICY IF EXISTS "Anyone can view sapo orders" ON public.sapo_orders;
DROP POLICY IF EXISTS "Anyone can view sapo order items" ON public.sapo_order_items;
DROP POLICY IF EXISTS "Anyone can view sapo products" ON public.sapo_products;
DROP POLICY IF EXISTS "Anyone can view sapo variants" ON public.sapo_product_variants;
DROP POLICY IF EXISTS "Anyone can view sapo images" ON public.sapo_product_images;

-- MISA Tables
DROP POLICY IF EXISTS "Anyone can view misa products" ON public.misa_products;
DROP POLICY IF EXISTS "Anyone can view misa invoice marketplaces" ON public.misa_invoice_marketplaces;
-- Add unique constraint for upserting addresses from Shopify
ALTER TABLE public.customer_addresses 
ADD CONSTRAINT customer_addresses_unique_address UNIQUE (customer_id, address1, city);
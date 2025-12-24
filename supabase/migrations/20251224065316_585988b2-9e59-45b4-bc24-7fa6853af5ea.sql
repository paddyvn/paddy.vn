-- Add delivery_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN delivery_method text;
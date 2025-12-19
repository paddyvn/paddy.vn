-- Add name_vi column to product_option_templates for Vietnamese option names
ALTER TABLE public.product_option_templates
ADD COLUMN name_vi text;

-- Add value_vi column to product_option_template_values for Vietnamese option values
ALTER TABLE public.product_option_template_values
ADD COLUMN value_vi text;
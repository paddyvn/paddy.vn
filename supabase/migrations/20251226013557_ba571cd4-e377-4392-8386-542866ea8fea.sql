-- Make icon_type optional (no default icons unless explicitly chosen)
ALTER TABLE public.promotions
  ALTER COLUMN icon_type DROP DEFAULT;

-- Clear icon_type for promotions that have no custom icons (so UI renders no icons)
UPDATE public.promotions
SET icon_type = NULL
WHERE icon_type = 'dog_cat'
  AND (
    custom_icons IS NULL
    OR (jsonb_typeof(custom_icons) = 'array' AND jsonb_array_length(custom_icons) = 0)
  );

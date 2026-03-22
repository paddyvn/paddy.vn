
DROP FUNCTION IF EXISTS public.search_products(text, integer, integer);
DROP FUNCTION IF EXISTS public.search_suggestions(text, integer);

-- search_products: Full-text search for the search results page
CREATE OR REPLACE FUNCTION public.search_products(
  p_query text,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  base_price numeric,
  compare_at_price numeric,
  brand text,
  pet_type text,
  target_age_id uuid,
  target_size_id uuid,
  image_url text,
  health_condition_ids uuid[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
BEGIN
  v_normalized := LOWER(unaccent(COALESCE(p_query, '')));

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.base_price,
    p.compare_at_price,
    p.brand,
    p.pet_type,
    p.target_age_id,
    p.target_size_id,
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS image_url,
    ARRAY(
      SELECT phcl.health_condition_id
      FROM product_health_condition_links phcl
      WHERE phcl.product_id = p.id
    ) AS health_condition_ids
  FROM products p
  WHERE p.is_active = true
    AND (
      p.search_text ILIKE '%' || v_normalized || '%'
      OR LOWER(unaccent(COALESCE(p.brand, ''))) ILIKE '%' || v_normalized || '%'
    )
  ORDER BY
    CASE WHEN LOWER(unaccent(p.name)) ILIKE v_normalized || '%' THEN 0 ELSE 1 END,
    p.name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- search_suggestions: Autocomplete suggestions mixing products, brands, categories
CREATE OR REPLACE FUNCTION public.search_suggestions(
  p_query text,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  suggestion text,
  type text,
  slug text,
  image_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
  v_product_limit integer;
  v_brand_limit integer;
  v_category_limit integer;
BEGIN
  v_normalized := LOWER(unaccent(COALESCE(p_query, '')));

  IF length(trim(v_normalized)) < 2 THEN
    RETURN;
  END IF;

  v_brand_limit := 2;
  v_category_limit := 2;
  v_product_limit := GREATEST(1, p_limit - v_brand_limit - v_category_limit);

  RETURN QUERY
  (
    SELECT
      p.name AS suggestion,
      'product'::text AS type,
      p.slug,
      (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS image_url
    FROM products p
    WHERE p.is_active = true
      AND (
        p.search_text ILIKE '%' || v_normalized || '%'
        OR LOWER(unaccent(COALESCE(p.brand, ''))) ILIKE '%' || v_normalized || '%'
      )
    ORDER BY
      CASE WHEN LOWER(unaccent(p.name)) ILIKE v_normalized || '%' THEN 0 ELSE 1 END,
      p.name
    LIMIT v_product_limit
  )
  UNION ALL
  (
    SELECT
      b.name AS suggestion,
      'brand'::text AS type,
      b.slug,
      b.logo_url AS image_url
    FROM brands b
    WHERE b.is_active = true
      AND LOWER(unaccent(b.name)) ILIKE '%' || v_normalized || '%'
    ORDER BY b.name
    LIMIT v_brand_limit
  )
  UNION ALL
  (
    SELECT
      c.name AS suggestion,
      'category'::text AS type,
      c.slug,
      c.image_url
    FROM categories c
    WHERE c.is_active = true
      AND (
        LOWER(unaccent(c.name)) ILIKE '%' || v_normalized || '%'
        OR LOWER(unaccent(COALESCE(c.meta_title, ''))) ILIKE '%' || v_normalized || '%'
      )
    ORDER BY c.name
    LIMIT v_category_limit
  )
  LIMIT p_limit;
END;
$$;

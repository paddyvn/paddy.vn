-- Add optional columns to navigation_columns for pet selector support
ALTER TABLE public.navigation_columns 
ADD COLUMN IF NOT EXISTS icon_type text,
ADD COLUMN IF NOT EXISTS background_color text,
ADD COLUMN IF NOT EXISTS group_type text;

-- Add comment for clarity
COMMENT ON COLUMN public.navigation_columns.icon_type IS 'Icon identifier for pet selector blocks (e.g., dog, cat, bone, fish)';
COMMENT ON COLUMN public.navigation_columns.background_color IS 'Background color for pet selector blocks (e.g., #F97316)';
COMMENT ON COLUMN public.navigation_columns.group_type IS 'Group identifier for pet selector (e.g., dog, cat)';

-- Seed the pet-selector menu with initial data
INSERT INTO public.navigation_menus (name, slug, is_active, display_order)
VALUES ('Pet Selector', 'pet-selector', true, 0)
ON CONFLICT (slug) DO NOTHING;

-- Get the menu id and insert columns
DO $$
DECLARE
  menu_uuid uuid;
  dog_col_uuid uuid;
  puppy_col_uuid uuid;
  cat_col_uuid uuid;
  kitten_col_uuid uuid;
BEGIN
  SELECT id INTO menu_uuid FROM navigation_menus WHERE slug = 'pet-selector';
  
  -- Insert Dog column
  INSERT INTO navigation_columns (menu_id, title, shop_all_link, display_order, icon_type, background_color, group_type)
  VALUES (menu_uuid, 'Dog', '/category/dog', 0, 'dog', '#F97316', 'dog')
  RETURNING id INTO dog_col_uuid;
  
  -- Insert Puppy column
  INSERT INTO navigation_columns (menu_id, title, shop_all_link, display_order, icon_type, background_color, group_type)
  VALUES (menu_uuid, 'Puppy', '/category/puppy', 1, 'dog', '#FB923C', 'dog')
  RETURNING id INTO puppy_col_uuid;
  
  -- Insert Cat column
  INSERT INTO navigation_columns (menu_id, title, shop_all_link, display_order, icon_type, background_color, group_type)
  VALUES (menu_uuid, 'Cat', '/category/cat', 2, 'cat', '#3B82F6', 'cat')
  RETURNING id INTO cat_col_uuid;
  
  -- Insert Kitten column
  INSERT INTO navigation_columns (menu_id, title, shop_all_link, display_order, icon_type, background_color, group_type)
  VALUES (menu_uuid, 'Kitten', '/category/kitten', 3, 'cat', '#60A5FA', 'cat')
  RETURNING id INTO kitten_col_uuid;
  
  -- Insert quick links for Dog group
  INSERT INTO navigation_items (column_id, label, link, display_order) VALUES
  (dog_col_uuid, 'Food', '/category/dog-food', 0),
  (dog_col_uuid, 'Treats', '/category/dog-treats', 1),
  (dog_col_uuid, 'Toys', '/category/dog-toys', 2),
  (dog_col_uuid, 'Grooming', '/category/dog-grooming', 3),
  (dog_col_uuid, 'Health', '/category/dog-health', 4),
  (dog_col_uuid, 'Accessories', '/category/dog-accessories', 5);
  
  -- Insert quick links for Cat group
  INSERT INTO navigation_items (column_id, label, link, display_order) VALUES
  (cat_col_uuid, 'Food', '/category/cat-food', 0),
  (cat_col_uuid, 'Treats', '/category/cat-treats', 1),
  (cat_col_uuid, 'Toys', '/category/cat-toys', 2),
  (cat_col_uuid, 'Grooming', '/category/cat-grooming', 3),
  (cat_col_uuid, 'Health', '/category/cat-health', 4),
  (cat_col_uuid, 'Litter', '/category/cat-litter', 5);
END $$;
-- Fix Dog column header links
UPDATE navigation_columns 
SET shop_all_link = '/collections/thuc-an-cho-cho'
WHERE id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector' AND c.group_type = 'dog'
);

-- Fix Cat column header links
UPDATE navigation_columns 
SET shop_all_link = '/collections/thuc-an-cho-meo'
WHERE id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector' AND c.group_type = 'cat'
);

-- Fix Dog item links
UPDATE navigation_items SET link = '/collections/do-choi-cho-cho-thu-nhoi-bong'
WHERE link = '/category/dog-toys'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);

UPDATE navigation_items SET link = '/collections/cham-soc-ve-sinh-cho-cho'
WHERE link = '/category/dog-grooming'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);

UPDATE navigation_items SET link = '/collections/cham-soc-suc-khoe-cho-cho'
WHERE link = '/category/dog-health'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);

UPDATE navigation_items SET link = '/collections/phu-kien-thu-cung'
WHERE link = '/category/dog-accessories'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);

-- Fix Cat item links
UPDATE navigation_items SET link = '/collections/thuc-an-cho-meo'
WHERE link = '/category/cat-food'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);

UPDATE navigation_items SET link = '/collections/banh-thuong-cho-meo'
WHERE link = '/category/cat-treats'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);

UPDATE navigation_items SET link = '/collections/ban-cao-mong-cho-meo'
WHERE link = '/category/cat-toys'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);

UPDATE navigation_items SET link = '/collections/cham-soc-ve-sinh-cho-meo'
WHERE link = '/category/cat-grooming'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);

UPDATE navigation_items SET link = '/collections/cham-soc-suc-khoe-cho-meo'
WHERE link = '/category/cat-health'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);

UPDATE navigation_items SET link = '/collections/cat-meo'
WHERE link = '/category/cat-litter'
AND column_id IN (
  SELECT c.id FROM navigation_columns c
  JOIN navigation_menus m ON m.id = c.menu_id
  WHERE m.slug = 'pet-selector'
);
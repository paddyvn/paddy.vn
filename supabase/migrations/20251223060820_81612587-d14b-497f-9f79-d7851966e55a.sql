-- Fix display_order to sequential values
UPDATE blog_categories SET display_order = 1 WHERE slug = 'khuyen-mai';
UPDATE blog_categories SET display_order = 2 WHERE slug = 'ki-niem-sen-boss';
UPDATE blog_categories SET display_order = 3 WHERE slug = 'kien-thuc-cham-soc-thu-cung';
UPDATE blog_categories SET display_order = 4 WHERE slug = 'news';
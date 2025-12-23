-- Fix broken slugs with proper Vietnamese-to-ASCII conversion
UPDATE blog_categories SET slug = 'khuyen-mai' WHERE id = 'e9439125-bfd1-43fe-8b56-a672512b2973';
UPDATE blog_categories SET slug = 'ki-niem-sen-boss' WHERE id = 'c22ac7bc-f4d2-4907-840e-2d58c1b4dbb0';
UPDATE blog_categories SET slug = 'kien-thuc-cham-soc-thu-cung' WHERE id = 'fd08c279-b4cb-42c4-9542-8d67ea1d091c';
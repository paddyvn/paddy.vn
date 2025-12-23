-- Add shopify_blog_id to blog_categories
ALTER TABLE blog_categories ADD COLUMN IF NOT EXISTS shopify_blog_id TEXT;

-- Update existing categories with correct Shopify slugs based on blog_id
UPDATE blog_categories bc
SET slug = 'news', shopify_blog_id = '84872659201'
WHERE bc.name = 'News';

UPDATE blog_categories bc
SET slug = 'ki-niem-sen-boss', shopify_blog_id = '89302991105'
WHERE bc.name = 'Kỉ niệm Sen & Boss';

UPDATE blog_categories bc
SET slug = 'cham-soc-thu-cung', shopify_blog_id = '87127621889'
WHERE bc.name = 'Kiến Thức Chăm Sóc Thú Cưng';

UPDATE blog_categories bc
SET slug = 'khuyen-mai', shopify_blog_id = '89324945665'
WHERE bc.name = 'Khuyến mãi';

UPDATE top_nav_items SET position = position + 1 WHERE position >= 2;

INSERT INTO top_nav_items (label, link_url, position, is_active)
VALUES ('Danh Mục Sản Phẩm', '/collections', 2, true);

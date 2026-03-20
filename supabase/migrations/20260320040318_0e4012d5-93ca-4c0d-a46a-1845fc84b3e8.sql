
-- Footer Về Paddy menu
INSERT INTO navigation_menus (id, name, slug, is_active, display_order)
VALUES ('f0000000-0000-0000-0000-000000000001', 'Footer - Về Paddy', 'footer-ve-paddy', true, 10);

INSERT INTO navigation_columns (id, menu_id, title, display_order)
VALUES ('fc000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Về Paddy', 0);

INSERT INTO navigation_items (column_id, label, link, display_order) VALUES
('fc000000-0000-0000-0000-000000000001', 'Giới Thiệu', '/pages/paddy-pet-shop', 0),
('fc000000-0000-0000-0000-000000000001', 'Thành Viên Paddier', '/pages/uu-dai-tich-luy-thanh-vien-paddier', 1),
('fc000000-0000-0000-0000-000000000001', 'Liên Hệ', '/pages/lien-he', 2),
('fc000000-0000-0000-0000-000000000001', 'Tuyển Dụng', '/pages/tuyen-dung', 3);

-- Footer Shop menu
INSERT INTO navigation_menus (id, name, slug, is_active, display_order)
VALUES ('f0000000-0000-0000-0000-000000000002', 'Footer - Shop', 'footer-shop', true, 11);

INSERT INTO navigation_columns (id, menu_id, title, display_order)
VALUES ('fc000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'Shop', 0);

INSERT INTO navigation_items (column_id, label, link, display_order) VALUES
('fc000000-0000-0000-0000-000000000002', 'Dành Cho Chó', '/collections/cho', 0),
('fc000000-0000-0000-0000-000000000002', 'Dành Cho Mèo', '/collections/meo', 1),
('fc000000-0000-0000-0000-000000000002', 'Thương Hiệu', '/brands-thuong-hieu-thu-cung', 2),
('fc000000-0000-0000-0000-000000000002', 'Blogs', '/blogs', 3),
('fc000000-0000-0000-0000-000000000002', 'Bộ Sưu Tập', '/collections', 4);

-- Footer Hỗ Trợ Khách Hàng menu
INSERT INTO navigation_menus (id, name, slug, is_active, display_order)
VALUES ('f0000000-0000-0000-0000-000000000003', 'Footer - Hỗ Trợ Khách Hàng', 'footer-ho-tro', true, 12);

INSERT INTO navigation_columns (id, menu_id, title, display_order)
VALUES ('fc000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'Hỗ Trợ Khách Hàng', 0);

INSERT INTO navigation_items (column_id, label, link, display_order) VALUES
('fc000000-0000-0000-0000-000000000003', 'Chính Sách Đổi Trả Hàng', '/pages/chinh-sach-dổi-trả-hang', 0),
('fc000000-0000-0000-0000-000000000003', 'Phương Thức Thanh Toán', '/pages/huong-dan-thanh-toan', 1);

-- Footer Social menu
INSERT INTO navigation_menus (id, name, slug, is_active, display_order)
VALUES ('f0000000-0000-0000-0000-000000000004', 'Footer - Social Media', 'footer-social', true, 13);

INSERT INTO navigation_columns (id, menu_id, title, display_order)
VALUES ('fc000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'Social', 0);

INSERT INTO navigation_items (column_id, label, link, display_order) VALUES
('fc000000-0000-0000-0000-000000000004', 'Facebook', 'https://facebook.com/paddyvn', 0),
('fc000000-0000-0000-0000-000000000004', 'Instagram', 'https://instagram.com/paddyvn', 1),
('fc000000-0000-0000-0000-000000000004', 'TikTok', 'https://tiktok.com/@paddyvn', 2);

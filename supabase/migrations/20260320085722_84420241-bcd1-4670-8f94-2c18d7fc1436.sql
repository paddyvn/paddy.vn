ALTER TABLE stores
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

UPDATE stores SET latitude = 10.8044, longitude = 106.6936
WHERE name ILIKE '%Trường Sa%';

UPDATE stores SET latitude = 10.8065, longitude = 106.6918
WHERE name ILIKE '%Nơ Trang Long%';

UPDATE stores SET latitude = 10.7878, longitude = 106.7347
WHERE name ILIKE '%Trần Não%';

UPDATE stores SET latitude = 10.7375, longitude = 106.7238
WHERE name ILIKE '%Nguyễn Thị Thập%';
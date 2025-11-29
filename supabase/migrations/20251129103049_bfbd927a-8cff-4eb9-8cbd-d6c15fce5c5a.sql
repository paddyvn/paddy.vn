-- Change position column from integer to bigint to handle large Shopify position values
ALTER TABLE product_collections 
ALTER COLUMN position TYPE bigint;
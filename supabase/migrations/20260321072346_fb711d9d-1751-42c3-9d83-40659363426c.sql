
-- Unique constraints for safe upsert on child records

-- Product images: unique on (product_id, source_image_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_source
ON product_images (product_id, source_image_id)
WHERE source_image_id IS NOT NULL;

-- Product variants: unique on (product_id, source_variant_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_source
ON product_variants (product_id, source_variant_id)
WHERE source_variant_id IS NOT NULL;

-- Order items: add shopify_line_item_id column and unique index
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS shopify_line_item_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_items_shopify
ON order_items (order_id, shopify_line_item_id)
WHERE shopify_line_item_id IS NOT NULL;

-- Order fulfillments: unique on (order_id, shopify_fulfillment_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_fulfillments_shopify
ON order_fulfillments (order_id, shopify_fulfillment_id)
WHERE shopify_fulfillment_id IS NOT NULL;

-- Order events: unique on (order_id, shopify_event_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_events_shopify
ON order_events (order_id, shopify_event_id)
WHERE shopify_event_id IS NOT NULL;

-- Product collections: unique on (product_id, collection_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_collections_unique
ON product_collections (product_id, collection_id);

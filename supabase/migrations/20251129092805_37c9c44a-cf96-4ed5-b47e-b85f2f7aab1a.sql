-- Add Shopify collection ID and type to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS shopify_collection_id text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS collection_type text DEFAULT 'custom';
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_shopify_collection_id ON categories(shopify_collection_id);

-- Create product_collections junction table for many-to-many relationships
CREATE TABLE IF NOT EXISTS product_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, collection_id)
);

-- Enable RLS on product_collections
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_collections
CREATE POLICY "Anyone can view product collections" 
ON product_collections 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product collections" 
ON product_collections 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_collections_product_id ON product_collections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_collections_collection_id ON product_collections(collection_id);
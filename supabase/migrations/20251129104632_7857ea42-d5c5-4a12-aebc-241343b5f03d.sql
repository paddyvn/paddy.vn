-- Add collection rules field for automated collections
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rules_match_type TEXT DEFAULT 'all' CHECK (rules_match_type IN ('all', 'any'));
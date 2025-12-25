-- Fix program_kind values based on actual program content
UPDATE promotions SET program_kind = 'flash_sale' WHERE title ILIKE '%flash sale%' AND program_kind = 'discount';
UPDATE promotions SET program_kind = 'combo_buy' WHERE (title ILIKE '%combo%' OR title ILIKE '%mua%tặng%') AND program_kind = 'discount';
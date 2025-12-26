-- Backfill program_kind for vouchers that were created before setting program_kind
UPDATE public.promotions
SET program_kind = 'voucher'
WHERE promo_type = 'vouchers' AND (program_kind IS NULL OR program_kind <> 'voucher');
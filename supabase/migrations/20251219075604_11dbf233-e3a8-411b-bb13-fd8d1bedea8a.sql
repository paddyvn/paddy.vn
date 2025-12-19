-- Explicitly deny anonymous SELECT access to abandoned_checkouts (PII)
-- Note: existing admin policy remains in place for authenticated admins.

CREATE POLICY "Deny anonymous access to abandoned checkouts"
ON public.abandoned_checkouts
FOR SELECT
TO anon
USING (false);

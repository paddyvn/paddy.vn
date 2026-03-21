
-- Schedule daily sync for Orders at 8:00 AM VN time (1:00 AM UTC)
SELECT cron.schedule(
  'shopify-sync-orders-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fexafkqzpbzjcupvbfhe.supabase.co/functions/v1/shopify-sync-orders-batch',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGFma3F6cGJ6amN1cHZiZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzU4NzksImV4cCI6MjA3OTk1MTg3OX0.4pGuz_-KaRXZkOf1-3FlOzLuSDMJRAReg9a88JpTuw4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule daily sync for Customers at 8:00 AM VN time (1:00 AM UTC)
SELECT cron.schedule(
  'shopify-sync-customers-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fexafkqzpbzjcupvbfhe.supabase.co/functions/v1/shopify-sync-customers-batch',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGFma3F6cGJ6amN1cHZiZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzU4NzksImV4cCI6MjA3OTk1MTg3OX0.4pGuz_-KaRXZkOf1-3FlOzLuSDMJRAReg9a88JpTuw4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule daily sync for Abandoned Checkouts at 8:00 AM VN time (1:00 AM UTC)
SELECT cron.schedule(
  'shopify-sync-abandoned-checkouts-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fexafkqzpbzjcupvbfhe.supabase.co/functions/v1/shopify-sync-abandoned-checkouts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGFma3F6cGJ6amN1cHZiZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzU4NzksImV4cCI6MjA3OTk1MTg3OX0.4pGuz_-KaRXZkOf1-3FlOzLuSDMJRAReg9a88JpTuw4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

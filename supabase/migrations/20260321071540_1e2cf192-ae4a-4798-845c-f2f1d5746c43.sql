SELECT cron.schedule(
  'shopify-sync-orders-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fexafkqzpbzjcupvbfhe.supabase.co/functions/v1/shopify-sync-orders-batch',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGFma3F6cGJ6amN1cHZiZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzU4NzksImV4cCI6MjA3OTk1MTg3OX0.4pGuz_-KaRXZkOf1-3FlOzLuSDMJRAReg9a88JpTuw4", "x-cron-secret": "54963c5f4314d7e16a4e0e561f0aa0fe1f901be954f1a04d68b646c0a330e80d"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'shopify-sync-customers-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fexafkqzpbzjcupvbfhe.supabase.co/functions/v1/shopify-sync-customers-batch',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGFma3F6cGJ6amN1cHZiZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzU4NzksImV4cCI6MjA3OTk1MTg3OX0.4pGuz_-KaRXZkOf1-3FlOzLuSDMJRAReg9a88JpTuw4", "x-cron-secret": "54963c5f4314d7e16a4e0e561f0aa0fe1f901be954f1a04d68b646c0a330e80d"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'shopify-sync-abandoned-checkouts-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fexafkqzpbzjcupvbfhe.supabase.co/functions/v1/shopify-sync-abandoned-checkouts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGFma3F6cGJ6amN1cHZiZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzU4NzksImV4cCI6MjA3OTk1MTg3OX0.4pGuz_-KaRXZkOf1-3FlOzLuSDMJRAReg9a88JpTuw4", "x-cron-secret": "54963c5f4314d7e16a4e0e561f0aa0fe1f901be954f1a04d68b646c0a330e80d"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
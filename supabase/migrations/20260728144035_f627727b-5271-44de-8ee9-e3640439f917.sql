SELECT cron.schedule(
  'dispatch-outbox-emails',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://project--ab3803f6-e2c6-4d94-8e9f-d8cefdc8e072.lovable.app/api/public/send-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-dispatch-key', (select value from private.cron_keys where name = 'email_dispatch')
    ),
    body := '{}'::jsonb
  );
  $$
);
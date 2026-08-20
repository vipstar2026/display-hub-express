DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'afs-reconcile') THEN
    PERFORM cron.unschedule('afs-reconcile');
  END IF;
END $$;

SELECT cron.schedule(
  'afs-reconcile',
  '*/5 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://vipstar.cc/api/public/afs-reconcile',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-reconcile-key', (SELECT value FROM private.cron_keys WHERE name = 'afs_reconcile')
    ),
    body := '{}'::jsonb
  );
  $job$
);
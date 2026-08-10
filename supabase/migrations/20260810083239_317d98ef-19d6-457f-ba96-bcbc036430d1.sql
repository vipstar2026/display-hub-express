update public.payment_methods
set credentials = credentials
  || jsonb_build_object(
       'live_entity_id', '8acda4cd9e68c366019e8cc485162656',
       'live_access_token', 'OGFjZGE0ZGE5ZTY5MTJjZDAxOWU4Y2NlYjU1NjM4NTN8az9QVTc2VU1jeVE5cGtaMkhUIW4=',
       'webhook_decryption_key', coalesce(credentials->>'webhook_decryption_key', '')
     ),
    config = coalesce(config,'{}'::jsonb) || jsonb_build_object('webhook_url','https://vipstar.cc/api/public/payments/afs'),
    updated_at = now()
where gateway_provider = 'afs';
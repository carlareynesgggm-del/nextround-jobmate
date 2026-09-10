ALTER TABLE public.email_connections
  ADD COLUMN IF NOT EXISTS scope text,
  ADD COLUMN IF NOT EXISTS provider_account_id text,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE UNIQUE INDEX IF NOT EXISTS email_events_user_message_key
  ON public.email_events (user_id, message_id);

CREATE UNIQUE INDEX IF NOT EXISTS email_connections_user_provider_key
  ON public.email_connections (user_id, provider);
-- 1. Remove all demo data
DELETE FROM public.application_documents WHERE is_demo;
DELETE FROM public.application_events WHERE is_demo;
DELETE FROM public.calendar_events WHERE is_demo;
DELETE FROM public.contacts WHERE is_demo;
DELETE FROM public.notes WHERE is_demo;
DELETE FROM public.tasks WHERE is_demo;
DELETE FROM public.applications WHERE is_demo;
DELETE FROM public.documents WHERE is_demo;
DELETE FROM public.companies WHERE is_demo;

-- 2. Strict per-user policies
DROP POLICY IF EXISTS "apps read" ON public.applications;
DROP POLICY IF EXISTS "apps insert" ON public.applications;
DROP POLICY IF EXISTS "apps update" ON public.applications;
DROP POLICY IF EXISTS "apps delete" ON public.applications;
CREATE POLICY "apps own" ON public.applications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "companies read" ON public.companies;
DROP POLICY IF EXISTS "companies insert" ON public.companies;
DROP POLICY IF EXISTS "companies update" ON public.companies;
DROP POLICY IF EXISTS "companies delete" ON public.companies;
CREATE POLICY "companies own" ON public.companies FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ev read" ON public.application_events;
DROP POLICY IF EXISTS "ev insert" ON public.application_events;
DROP POLICY IF EXISTS "ev update" ON public.application_events;
DROP POLICY IF EXISTS "ev delete" ON public.application_events;
CREATE POLICY "ev own" ON public.application_events FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ad read" ON public.application_documents;
DROP POLICY IF EXISTS "ad insert" ON public.application_documents;
DROP POLICY IF EXISTS "ad update" ON public.application_documents;
DROP POLICY IF EXISTS "ad delete" ON public.application_documents;
CREATE POLICY "ad own" ON public.application_documents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cal read" ON public.calendar_events;
DROP POLICY IF EXISTS "cal insert" ON public.calendar_events;
DROP POLICY IF EXISTS "cal update" ON public.calendar_events;
DROP POLICY IF EXISTS "cal delete" ON public.calendar_events;
CREATE POLICY "cal own" ON public.calendar_events FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "contacts read" ON public.contacts;
DROP POLICY IF EXISTS "contacts insert" ON public.contacts;
DROP POLICY IF EXISTS "contacts update" ON public.contacts;
DROP POLICY IF EXISTS "contacts delete" ON public.contacts;
CREATE POLICY "contacts own" ON public.contacts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "docs read" ON public.documents;
DROP POLICY IF EXISTS "docs insert" ON public.documents;
DROP POLICY IF EXISTS "docs update" ON public.documents;
DROP POLICY IF EXISTS "docs delete" ON public.documents;
CREATE POLICY "docs own" ON public.documents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notes read" ON public.notes;
DROP POLICY IF EXISTS "notes insert" ON public.notes;
DROP POLICY IF EXISTS "notes update" ON public.notes;
DROP POLICY IF EXISTS "notes delete" ON public.notes;
CREATE POLICY "notes own" ON public.notes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tasks read" ON public.tasks;
DROP POLICY IF EXISTS "tasks insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks update" ON public.tasks;
DROP POLICY IF EXISTS "tasks delete" ON public.tasks;
CREATE POLICY "tasks own" ON public.tasks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Always bind rows to their owner
ALTER TABLE public.applications ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.companies ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.application_events ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.application_documents ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.calendar_events ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.contacts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.documents ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.notes ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.tasks ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. Email connections
CREATE TABLE public.email_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  provider text NOT NULL,
  email_address text,
  status text NOT NULL DEFAULT 'connected',
  ask_before_update boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  connection_key_ciphertext text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_connections TO authenticated;
GRANT ALL ON public.email_connections TO service_role;
ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email conn own" ON public.email_connections FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER t_email_connections BEFORE UPDATE ON public.email_connections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Detected recruitment emails
CREATE TABLE public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'gmail',
  message_id text NOT NULL,
  thread_id text,
  from_name text,
  from_email text,
  subject text,
  snippet text,
  body_text text,
  received_at timestamptz NOT NULL DEFAULT now(),
  email_type text,
  confidence numeric,
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, message_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email events own" ON public.email_events FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 6. Proposed updates awaiting confirmation
CREATE TABLE public.email_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  email_event_id uuid NOT NULL REFERENCES public.email_events(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  kind text NOT NULL,
  label text NOT NULL,
  detail text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_suggestions TO authenticated;
GRANT ALL ON public.email_suggestions TO service_role;
ALTER TABLE public.email_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email sugg own" ON public.email_suggestions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 7. Activity feed
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  detail text,
  source text NOT NULL DEFAULT 'app',
  email_event_id uuid REFERENCES public.email_events(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_feed TO authenticated;
GRANT ALL ON public.activity_feed TO service_role;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity own" ON public.activity_feed FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 8. Stored alerts
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  email_event_id uuid REFERENCES public.email_events(id) ON DELETE CASCADE,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  detail text,
  due_at timestamptz,
  read boolean NOT NULL DEFAULT false,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts own" ON public.alerts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_email_events_user_status ON public.email_events(user_id, status, received_at DESC);
CREATE INDEX idx_activity_app ON public.activity_feed(application_id, occurred_at DESC);
CREATE INDEX idx_alerts_user_open ON public.alerts(user_id, resolved, created_at DESC);
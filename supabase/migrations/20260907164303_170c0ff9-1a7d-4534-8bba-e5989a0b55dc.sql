-- applications: employment/application type, portal + job description storage
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS employment_type text,
  ADD COLUMN IF NOT EXISTS application_type text,
  ADD COLUMN IF NOT EXISTS candidate_portal_url text,
  ADD COLUMN IF NOT EXISTS jd_responsibilities text,
  ADD COLUMN IF NOT EXISTS jd_requirements text,
  ADD COLUMN IF NOT EXISTS jd_preferred text,
  ADD COLUMN IF NOT EXISTS jd_skills text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS jd_salary_text text,
  ADD COLUMN IF NOT EXISTS jd_benefits text,
  ADD COLUMN IF NOT EXISTS jd_saved_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_provider text,
  ADD COLUMN IF NOT EXISTS portal_username text,
  ADD COLUMN IF NOT EXISTS portal_password_ref text,
  ADD COLUMN IF NOT EXISTS portal_notes text,
  ADD COLUMN IF NOT EXISTS referral_name text;

-- application_documents: submitted flag + role + note, and allow updates
ALTER TABLE public.application_documents
  ADD COLUMN IF NOT EXISTS submitted boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DROP POLICY IF EXISTS "ad update" ON public.application_documents;
CREATE POLICY "ad update" ON public.application_documents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_demo)
  WITH CHECK (user_id = auth.uid() OR is_demo);

-- application_events: richer process stages
ALTER TABLE public.application_events
  ADD COLUMN IF NOT EXISTS stage public.app_stage,
  ADD COLUMN IF NOT EXISTS kind public.event_kind,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'done',
  ADD COLUMN IF NOT EXISTS interviewer text,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS attachments text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS application_events_app_pos_idx
  ON public.application_events (application_id, position, occurred_at);

-- contacts can belong to a specific application
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS contacts_application_idx ON public.contacts (application_id);

-- keep demo data looking complete
UPDATE public.application_events
SET stage = COALESCE(stage, to_stage),
    scheduled_at = COALESCE(scheduled_at, occurred_at)
WHERE is_demo;

UPDATE public.applications
SET employment_type = COALESCE(employment_type, 'Jornada completa'),
    application_type = COALESCE(application_type, COALESCE(source, 'Portal de empleo')),
    jd_saved_at = COALESCE(jd_saved_at, created_at),
    jd_responsibilities = COALESCE(jd_responsibilities,
      'Liderar el diseño de producto de extremo a extremo.' || chr(10) ||
      'Colaborar con ingeniería y research en cada release.' || chr(10) ||
      'Mantener y evolucionar el sistema de diseño.'),
    jd_requirements = COALESCE(jd_requirements,
      '4+ años de experiencia en producto digital.' || chr(10) ||
      'Portfolio con casos end-to-end.' || chr(10) ||
      'Inglés profesional.'),
    jd_preferred = COALESCE(jd_preferred, 'Experiencia previa en SaaS B2B y en equipos remotos.'),
    jd_skills = CASE WHEN cardinality(jd_skills) = 0
      THEN ARRAY['Figma','Design Systems','Prototipado','Research']::text[] ELSE jd_skills END,
    jd_benefits = COALESCE(jd_benefits, 'Seguro médico, presupuesto de formación y trabajo flexible.'),
    jd_salary_text = COALESCE(jd_salary_text,
      CASE WHEN salary_min IS NOT NULL AND salary_max IS NOT NULL
        THEN salary_min || ' – ' || salary_max || ' ' || currency || ' brutos/año' END)
WHERE is_demo;
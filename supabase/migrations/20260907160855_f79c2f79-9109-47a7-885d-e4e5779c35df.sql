-- ENUMS
CREATE TYPE public.app_stage AS ENUM ('saved','applied','screening','interview','technical','final','offer','rejected','withdrawn');
CREATE TYPE public.work_mode AS ENUM ('onsite','hybrid','remote');
CREATE TYPE public.doc_kind AS ENUM ('cv','cover_letter','portfolio','certificate','other');
CREATE TYPE public.event_kind AS ENUM ('interview','call','test','deadline','followup','other');

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  headline TEXT,
  location TEXT,
  target_role TEXT,
  weekly_goal INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  name TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  website TEXT,
  size TEXT,
  logo_hint TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies read" ON public.companies FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo);
CREATE POLICY "companies insert" ON public.companies FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "companies update" ON public.companies FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "companies delete" ON public.companies FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER t_companies BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CONTACTS
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role_title TEXT,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts read" ON public.contacts FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo);
CREATE POLICY "contacts insert" ON public.contacts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "contacts update" ON public.contacts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "contacts delete" ON public.contacts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  role_title TEXT NOT NULL,
  stage public.app_stage NOT NULL DEFAULT 'saved',
  location TEXT,
  work_mode public.work_mode,
  source TEXT,
  job_url TEXT,
  salary_min INT,
  salary_max INT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  excitement INT NOT NULL DEFAULT 3,
  priority TEXT NOT NULL DEFAULT 'medium',
  applied_at DATE,
  next_action TEXT,
  next_action_at DATE,
  description TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps read" ON public.applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo);
CREATE POLICY "apps insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "apps update" ON public.applications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "apps delete" ON public.applications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER t_apps BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_apps_user ON public.applications(user_id);
CREATE INDEX idx_apps_stage ON public.applications(stage);

-- TIMELINE EVENTS
CREATE TABLE public.application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT,
  from_stage public.app_stage,
  to_stage public.app_stage,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_events TO authenticated;
GRANT ALL ON public.application_events TO service_role;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ev read" ON public.application_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo);
CREATE POLICY "ev insert" ON public.application_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ev update" ON public.application_events FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ev delete" ON public.application_events FOR DELETE TO authenticated USING (user_id = auth.uid());

-- CALENDAR
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind public.event_kind NOT NULL DEFAULT 'interview',
  starts_at TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL DEFAULT 45,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cal read" ON public.calendar_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo);
CREATE POLICY "cal insert" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "cal update" ON public.calendar_events FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "cal delete" ON public.calendar_events FOR DELETE TO authenticated USING (user_id = auth.uid());

-- TASKS
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium',
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks read" ON public.tasks FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo);
CREATE POLICY "tasks insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks update" ON public.tasks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks delete" ON public.tasks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- NOTES
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes read" ON public.notes FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo);
CREATE POLICY "notes insert" ON public.notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes update" ON public.notes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes delete" ON public.notes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER t_notes BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- DOCUMENTS
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  name TEXT NOT NULL,
  kind public.doc_kind NOT NULL DEFAULT 'cv',
  version TEXT,
  storage_path TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs read" ON public.documents FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo);
CREATE POLICY "docs insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "docs update" ON public.documents FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "docs delete" ON public.documents FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.application_documents (
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (application_id, document_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad read" ON public.application_documents FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo);
CREATE POLICY "ad insert" ON public.application_documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ad delete" ON public.application_documents FOR DELETE TO authenticated USING (user_id = auth.uid());

-- STORAGE POLICIES (bucket created via tooling)
CREATE POLICY "own files read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ===== DEMO DATA (Carla) =====
INSERT INTO public.companies (id, is_demo, name, industry, location, website, size, notes) VALUES
 ('c0000001-0000-4000-8000-000000000001', true, 'Figma', 'Product Design Tools', 'Remote (EU)', 'https://figma.com', '1000-5000', 'Equipo de Growth Design en expansión en EMEA.'),
 ('c0000001-0000-4000-8000-000000000002', true, 'Revolut', 'Fintech', 'Barcelona, ES', 'https://revolut.com', '5000+', 'Proceso rápido, 4 etapas, mucho case study.'),
 ('c0000001-0000-4000-8000-000000000003', true, 'Factorial', 'HR SaaS', 'Barcelona, ES', 'https://factorialhr.com', '500-1000', 'Cultura muy product-led. Contacto vía referral.'),
 ('c0000001-0000-4000-8000-000000000004', true, 'Typeform', 'SaaS', 'Barcelona, ES', 'https://typeform.com', '250-500', 'Buen fit de portfolio; equipo pequeño de brand.'),
 ('c0000001-0000-4000-8000-000000000005', true, 'Cabify', 'Mobility', 'Madrid, ES', 'https://cabify.com', '1000-5000', 'Rol híbrido, 3 días oficina.'),
 ('c0000001-0000-4000-8000-000000000006', true, 'Stripe', 'Payments', 'Remote (EU)', 'https://stripe.com', '5000+', 'Listón alto en craft. Preparar caso de checkout.'),
 ('c0000001-0000-4000-8000-000000000007', true, 'Glovo', 'Delivery', 'Barcelona, ES', 'https://glovoapp.com', '1000-5000', 'Rechazada en última ronda, volver a intentar en Q4.'),
 ('c0000001-0000-4000-8000-000000000008', true, 'Qonto', 'Fintech', 'Remote (EU)', 'https://qonto.com', '1000-5000', 'Guardada: abren posición en septiembre.');

INSERT INTO public.contacts (is_demo, company_id, name, role_title, email, linkedin, notes) VALUES
 (true,'c0000001-0000-4000-8000-000000000002','Marta Ruiz','Talent Partner','marta.ruiz@revolut.demo','https://linkedin.com/in/demo-marta','Responde rápido por email.'),
 (true,'c0000001-0000-4000-8000-000000000003','Iván Pardo','Head of Design','ivan.pardo@factorial.demo','https://linkedin.com/in/demo-ivan','Referral de Laura.'),
 (true,'c0000001-0000-4000-8000-000000000006','Ana Beltrán','Recruiter','ana.beltran@stripe.demo',NULL,'Pidió portfolio actualizado.');

INSERT INTO public.applications (id, is_demo, company_id, role_title, stage, location, work_mode, source, job_url, salary_min, salary_max, excitement, priority, applied_at, next_action, next_action_at, description) VALUES
 ('a0000001-0000-4000-8000-000000000001', true,'c0000001-0000-4000-8000-000000000006','Senior Product Designer','final','Remote (EU)','remote','Referral','https://stripe.com/jobs',72000,88000,5,'high','2026-08-04','Preparar presentación final con el equipo de Payments','2026-09-10','Diseño de flujos de checkout y optimización de conversión para Europa.'),
 ('a0000001-0000-4000-8000-000000000002', true,'c0000001-0000-4000-8000-000000000001','Product Designer, Growth','interview','Remote (EU)','remote','LinkedIn','https://figma.com/careers',68000,82000,5,'high','2026-08-12','Entrevista con hiring manager','2026-09-09','Experimentación y onboarding para autoservicio.'),
 ('a0000001-0000-4000-8000-000000000003', true,'c0000001-0000-4000-8000-000000000002','Senior Product Designer','technical','Barcelona, ES','hybrid','Web corporativa',NULL,65000,78000,4,'high','2026-08-18','Entregar case study de app de pagos','2026-09-08','Equipo de Wealth & Trading.'),
 ('a0000001-0000-4000-8000-000000000004', true,'c0000001-0000-4000-8000-000000000003','Product Designer','screening','Barcelona, ES','hybrid','Referral',NULL,52000,62000,4,'medium','2026-08-24','Llamada con Talent','2026-09-11','Rediseño del módulo de ausencias.'),
 ('a0000001-0000-4000-8000-000000000005', true,'c0000001-0000-4000-8000-000000000004','Brand Designer','applied','Barcelona, ES','hybrid','InfoJobs',NULL,45000,55000,3,'medium','2026-08-28','Hacer seguimiento por email','2026-09-12','Sistema de marca y campañas.'),
 ('a0000001-0000-4000-8000-000000000006', true,'c0000001-0000-4000-8000-000000000005','UX Designer','applied','Madrid, ES','hybrid','LinkedIn',NULL,48000,58000,3,'low','2026-09-01','Buscar contacto interno','2026-09-15','Equipo de conductor y operaciones.'),
 ('a0000001-0000-4000-8000-000000000007', true,'c0000001-0000-4000-8000-000000000007','Senior Product Designer','rejected','Barcelona, ES','onsite','LinkedIn',NULL,60000,70000,3,'low','2026-07-15','Pedir feedback y reintentar en Q4','2026-10-01','Marketplace y pricing.'),
 ('a0000001-0000-4000-8000-000000000008', true,'c0000001-0000-4000-8000-000000000008','Product Designer','saved','Remote (EU)','remote','Newsletter',NULL,55000,68000,4,'medium',NULL,'Vigilar apertura de la vacante','2026-09-20','Posición prevista para septiembre.'),
 ('a0000001-0000-4000-8000-000000000009', true,'c0000001-0000-4000-8000-000000000001','Design Systems Designer','offer','Remote (EU)','remote','Referral',NULL,70000,84000,5,'high','2026-07-02','Responder a la oferta antes del viernes','2026-09-09','Mantenimiento y evolución del design system.'),
 ('a0000001-0000-4000-8000-000000000010', true,'c0000001-0000-4000-8000-000000000005','Product Designer, Mobile','withdrawn','Madrid, ES','onsite','Web corporativa',NULL,44000,52000,2,'low','2026-06-20','Sin acción',NULL,'Retirada por requerir presencialidad total.');

INSERT INTO public.application_events (is_demo, application_id, title, detail, from_stage, to_stage, occurred_at) VALUES
 (true,'a0000001-0000-4000-8000-000000000001','Candidatura enviada','Referral de Ana Beltrán.',NULL,'applied','2026-08-04 09:20+00'),
 (true,'a0000001-0000-4000-8000-000000000001','Screening con recruiter','30 min, buena sintonía.','applied','screening','2026-08-11 15:00+00'),
 (true,'a0000001-0000-4000-8000-000000000001','Ejercicio técnico entregado','Case study de checkout.','screening','technical','2026-08-21 18:30+00'),
 (true,'a0000001-0000-4000-8000-000000000001','Pasa a ronda final','Panel con 3 personas.','technical','final','2026-09-02 10:00+00'),
 (true,'a0000001-0000-4000-8000-000000000002','Candidatura enviada',NULL,NULL,'applied','2026-08-12 08:00+00'),
 (true,'a0000001-0000-4000-8000-000000000002','Screening superado',NULL,'applied','screening','2026-08-20 11:00+00'),
 (true,'a0000001-0000-4000-8000-000000000002','Entrevista de portfolio','Muy buen feedback del equipo.','screening','interview','2026-08-31 16:00+00'),
 (true,'a0000001-0000-4000-8000-000000000003','Candidatura enviada',NULL,NULL,'applied','2026-08-18 09:00+00'),
 (true,'a0000001-0000-4000-8000-000000000003','Llamada con Marta Ruiz',NULL,'applied','screening','2026-08-26 12:00+00'),
 (true,'a0000001-0000-4000-8000-000000000003','Prueba técnica asignada','Entrega el 8 de septiembre.','screening','technical','2026-09-03 09:30+00'),
 (true,'a0000001-0000-4000-8000-000000000004','Candidatura enviada','Vía referral de Iván.',NULL,'applied','2026-08-24 10:00+00'),
 (true,'a0000001-0000-4000-8000-000000000004','Screening agendado',NULL,'applied','screening','2026-09-04 09:00+00'),
 (true,'a0000001-0000-4000-8000-000000000009','Oferta recibida','70.000 € + bonus.','final','offer','2026-09-05 17:00+00'),
 (true,'a0000001-0000-4000-8000-000000000007','Rechazo tras ronda final','Buscaban más experiencia en marketplace.','final','rejected','2026-08-08 14:00+00'),
 (true,'a0000001-0000-4000-8000-000000000010','Candidatura retirada','100% presencial en Madrid.','screening','withdrawn','2026-07-10 10:00+00');

INSERT INTO public.calendar_events (is_demo, application_id, title, kind, starts_at, duration_min, location, notes) VALUES
 (true,'a0000001-0000-4000-8000-000000000002','Entrevista con hiring manager','interview','2026-09-09 10:00+00',45,'Google Meet','Repasar métricas de onboarding.'),
 (true,'a0000001-0000-4000-8000-000000000003','Entrega de case study','deadline','2026-09-08 17:00+00',30,'Email','Enviar PDF + Figma.'),
 (true,'a0000001-0000-4000-8000-000000000001','Panel final Stripe','interview','2026-09-10 15:00+00',90,'Zoom','3 entrevistadores.'),
 (true,'a0000001-0000-4000-8000-000000000004','Llamada con Talent','call','2026-09-11 09:30+00',30,'Teléfono',NULL),
 (true,'a0000001-0000-4000-8000-000000000009','Fecha límite respuesta oferta','deadline','2026-09-12 12:00+00',15,'Email','Negociar equity.'),
 (true,'a0000001-0000-4000-8000-000000000005','Seguimiento Typeform','followup','2026-09-15 09:00+00',15,'Email',NULL);

INSERT INTO public.tasks (is_demo, application_id, title, due_date, priority, done) VALUES
 (true,'a0000001-0000-4000-8000-000000000001','Preparar guion del panel final','2026-09-09','high',false),
 (true,'a0000001-0000-4000-8000-000000000003','Terminar case study de pagos','2026-09-08','high',false),
 (true,'a0000001-0000-4000-8000-000000000002','Actualizar portfolio con caso de growth','2026-09-08','medium',true),
 (true,'a0000001-0000-4000-8000-000000000009','Preparar negociación salarial','2026-09-11','high',false),
 (true,'a0000001-0000-4000-8000-000000000005','Enviar email de seguimiento','2026-09-15','medium',false),
 (true,'a0000001-0000-4000-8000-000000000006','Buscar contacto interno en Cabify','2026-09-16','low',false),
 (true,NULL,'Revisar 5 vacantes nuevas esta semana','2026-09-13','medium',false);

INSERT INTO public.notes (is_demo, application_id, company_id, title, body, pinned) VALUES
 (true,'a0000001-0000-4000-8000-000000000001','c0000001-0000-4000-8000-000000000006','Notas del panel','Insisten en impacto medible. Llevar números de conversión del proyecto de checkout anterior.',true),
 (true,'a0000001-0000-4000-8000-000000000002','c0000001-0000-4000-8000-000000000001','Feedback de portfolio','Les gustó el caso de onboarding. Quieren ver más proceso de experimentación.',false),
 (true,'a0000001-0000-4000-8000-000000000003','c0000001-0000-4000-8000-000000000002','Brief de la prueba','Rediseñar el flujo de envío de dinero. Máx. 6 pantallas + rationale.',true),
 (true,'a0000001-0000-4000-8000-000000000009','c0000001-0000-4000-8000-000000000001','Detalles de la oferta','70.000 € base, 10% bonus, remoto EU, 25 días. Preguntar por equity y presupuesto de formación.',true);

INSERT INTO public.documents (is_demo, name, kind, version, mime_type, size_bytes, is_default, tags) VALUES
 (true,'CV Carla — Product Design (ES)','cv','v4.2','application/pdf',248000,true,'{es,producto}'),
 (true,'CV Carla — Product Design (EN)','cv','v4.2','application/pdf',251000,false,'{en,producto}'),
 (true,'CV Carla — Brand & Visual','cv','v2.0','application/pdf',233000,false,'{en,marca}'),
 (true,'Carta de presentación — Fintech','cover_letter','v1.3','application/pdf',98000,false,'{fintech}'),
 (true,'Portfolio 2026','portfolio','v6','application/pdf',5400000,false,'{portfolio}');
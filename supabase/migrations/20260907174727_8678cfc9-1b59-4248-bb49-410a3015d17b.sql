ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS salary_period text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS duration_months integer,
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS visa_sponsorship boolean,
  ADD COLUMN IF NOT EXISTS relocation_support boolean,
  ADD COLUMN IF NOT EXISTS university_agreement boolean,
  ADD COLUMN IF NOT EXISTS language_requirements text,
  ADD COLUMN IF NOT EXISTS degree_requirement text,
  ADD COLUMN IF NOT EXISTS gpa_requirement text,
  ADD COLUMN IF NOT EXISTS work_authorisation text,
  ADD COLUMN IF NOT EXISTS academic_credits text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS job_ref text,
  ADD COLUMN IF NOT EXISTS application_ref text,
  ADD COLUMN IF NOT EXISTS why_interested text,
  ADD COLUMN IF NOT EXISTS application_plan text,
  ADD COLUMN IF NOT EXISTS offer_salary numeric,
  ADD COLUMN IF NOT EXISTS offer_currency text,
  ADD COLUMN IF NOT EXISTS offer_bonus text,
  ADD COLUMN IF NOT EXISTS offer_equity text,
  ADD COLUMN IF NOT EXISTS offer_benefits text,
  ADD COLUMN IF NOT EXISTS offer_start_date date,
  ADD COLUMN IF NOT EXISTS offer_deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS offer_decision text,
  ADD COLUMN IF NOT EXISTS offer_rating integer;

ALTER TABLE public.application_events
  ADD COLUMN IF NOT EXISTS stage_type text,
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS duration_min integer,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS interviewer_role text,
  ADD COLUMN IF NOT EXISTS interviewer_email text,
  ADD COLUMN IF NOT EXISTS interviewer_linkedin text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS assessment_url text,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS prep_notes text,
  ADD COLUMN IF NOT EXISTS questions_asked text,
  ADD COLUMN IF NOT EXISTS went_well text,
  ADD COLUMN IF NOT EXISTS went_poorly text,
  ADD COLUMN IF NOT EXISTS salary_mentioned text,
  ADD COLUMN IF NOT EXISTS next_steps text,
  ADD COLUMN IF NOT EXISTS expected_response_at date;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS contact_type text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS target_industry text,
  ADD COLUMN IF NOT EXISTS target_role text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS follow_up_days integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS graduation_year integer;
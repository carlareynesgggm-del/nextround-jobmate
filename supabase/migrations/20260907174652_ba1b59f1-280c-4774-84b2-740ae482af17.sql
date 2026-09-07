ALTER TYPE public.app_stage ADD VALUE IF NOT EXISTS 'assessment' AFTER 'screening';
ALTER TYPE public.app_stage ADD VALUE IF NOT EXISTS 'accepted' AFTER 'offer';
ALTER TYPE public.app_stage ADD VALUE IF NOT EXISTS 'ghosted';
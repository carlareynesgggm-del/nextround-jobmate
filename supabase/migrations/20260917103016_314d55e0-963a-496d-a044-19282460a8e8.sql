CREATE OR REPLACE FUNCTION public.merge_applications(
  canonical_id uuid,
  duplicate_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  canonical_user_id uuid;
  duplicate_user_id uuid;
  canonical_exists boolean;
  duplicate_exists boolean;
BEGIN
  IF canonical_id IS NULL
     OR duplicate_id IS NULL
     OR canonical_id = duplicate_id THEN
    RAISE EXCEPTION
      'Las candidaturas canónica y duplicada deben ser distintas';
  END IF;

  SELECT user_id
  INTO canonical_user_id
  FROM public.applications
  WHERE id = canonical_id
  FOR UPDATE;
  canonical_exists := FOUND;

  SELECT user_id
  INTO duplicate_user_id
  FROM public.applications
  WHERE id = duplicate_id
  FOR UPDATE;
  duplicate_exists := FOUND;

  IF NOT canonical_exists OR NOT duplicate_exists THEN
    RAISE EXCEPTION
      'No se encontraron ambas candidaturas';
  END IF;

  IF canonical_user_id IS DISTINCT FROM auth.uid()
    OR duplicate_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION
      'No puedes fusionar candidaturas de otro usuario';
  END IF;

  UPDATE public.applications AS canonical
  SET
    job_url = COALESCE(NULLIF(canonical.job_url, ''), duplicate.job_url),
    candidate_portal_url = COALESCE(
      NULLIF(canonical.candidate_portal_url, ''),
      duplicate.candidate_portal_url
    ),
    application_ref = COALESCE(NULLIF(canonical.application_ref, ''), duplicate.application_ref),
    applied_at = COALESCE(canonical.applied_at, duplicate.applied_at)
  FROM public.applications AS duplicate
  WHERE canonical.id = canonical_id
    AND duplicate.id = duplicate_id;

  DELETE FROM public.application_documents AS duplicate_link
  USING public.application_documents AS canonical_link
  WHERE duplicate_link.application_id = duplicate_id
    AND canonical_link.application_id = canonical_id
    AND duplicate_link.document_id = canonical_link.document_id;

  UPDATE public.application_documents
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  UPDATE public.application_events
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  UPDATE public.calendar_events
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  UPDATE public.tasks
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  UPDATE public.notes
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  UPDATE public.contacts
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  UPDATE public.email_suggestions
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  UPDATE public.activity_feed
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  UPDATE public.alerts
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  UPDATE public.email_events
  SET application_id = canonical_id
  WHERE application_id = duplicate_id;

  DELETE FROM public.applications
  WHERE id = duplicate_id;
END;
$$;

REVOKE ALL
ON FUNCTION public.merge_applications(uuid, uuid)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.merge_applications(uuid, uuid)
TO authenticated;
CREATE OR REPLACE FUNCTION public.resolve_email_application(
  p_event_id uuid,
  p_suggestion_id uuid,
  p_application_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_user_id uuid;
  event_application_id uuid;
  event_subject text;

  application_user_id uuid;

  suggestion_user_id uuid;
  suggestion_event_id uuid;
  suggestion_application_id uuid;
  suggestion_status text;
BEGIN
  /* Lock the Gmail event before validating or changing its association. */
  SELECT user_id
       , application_id
       , subject
  INTO event_user_id
     , event_application_id
     , event_subject
  FROM public.email_events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el correo indicado';
  END IF;

  /* Lock the target application while the relationship is resolved. */
  SELECT user_id
  INTO application_user_id
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró la candidatura indicada';
  END IF;

  /* Lock and validate the originating suggestion. */
  SELECT email_event_id
       , user_id
       , application_id
       , status
  INTO suggestion_event_id
     , suggestion_user_id
     , suggestion_application_id
     , suggestion_status
  FROM public.email_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró la sugerencia indicada';
  END IF;

  IF event_user_id IS DISTINCT FROM auth.uid()
     OR application_user_id IS DISTINCT FROM auth.uid()
     OR suggestion_user_id IS DISTINCT FROM auth.uid()
     OR suggestion_event_id IS DISTINCT FROM p_event_id THEN
    RAISE EXCEPTION 'No puedes resolver este correo y candidatura';
  END IF;

  /* A repeated identical call is already complete and must be a no-op. */
  IF suggestion_status = 'applied'
     AND suggestion_application_id = p_application_id
     AND event_application_id = p_application_id THEN
    RETURN;
  END IF;

  IF suggestion_status = 'applied' THEN
    RAISE EXCEPTION 'Esta sugerencia ya ha sido resuelta';
  END IF;

  IF event_application_id IS NOT NULL
     AND event_application_id IS DISTINCT FROM p_application_id THEN
    RAISE EXCEPTION 'Este correo ya está vinculado a otra candidatura';
  END IF;

  UPDATE public.email_events
  SET application_id = p_application_id,
      status = 'applied'
  WHERE id = p_event_id;

  UPDATE public.email_suggestions
  SET application_id = p_application_id,
      status = 'applied'
  WHERE id = p_suggestion_id;

  INSERT INTO public.activity_feed (
    user_id,
    application_id,
    email_event_id,
    kind,
    title,
    detail,
    source
  )
  SELECT
    auth.uid(),
    p_application_id,
    p_event_id,
    'email',
    'Candidatura creada desde Gmail',
    COALESCE(event_subject, 'Correo de candidatura'),
    'email'
  FROM public.email_events
  WHERE id = p_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_email_application(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_email_application(uuid, uuid, uuid) TO authenticated;

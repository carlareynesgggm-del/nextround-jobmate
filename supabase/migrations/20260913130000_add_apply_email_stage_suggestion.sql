CREATE OR REPLACE FUNCTION public.apply_email_stage_suggestion(
  p_event_id uuid,
  p_suggestion_id uuid,
  p_application_id uuid,
  p_stage public.app_stage,
  p_automatic boolean DEFAULT false
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
  previous_stage public.app_stage;

  suggestion_user_id uuid;
  suggestion_event_id uuid;
  suggestion_application_id uuid;
  suggestion_status text;
  suggestion_payload jsonb;

  suggested_stage public.app_stage;
BEGIN
  SELECT user_id, application_id, subject
  INTO event_user_id, event_application_id, event_subject
  FROM public.email_events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el correo indicado';
  END IF;

  SELECT user_id, stage
  INTO application_user_id, previous_stage
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró la candidatura indicada';
  END IF;

  SELECT user_id, email_event_id, application_id, status, payload
  INTO suggestion_user_id, suggestion_event_id, suggestion_application_id,
       suggestion_status, suggestion_payload
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
    RAISE EXCEPTION 'No puedes aplicar esta actualización de Gmail';
  END IF;

  IF suggestion_payload IS NULL
     OR suggestion_payload ->> 'stage' IS NULL THEN
    RAISE EXCEPTION 'La sugerencia no contiene una etapa válida';
  END IF;

  BEGIN
    suggested_stage := (suggestion_payload ->> 'stage')::public.app_stage;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'La etapa de la sugerencia no es válida';
  END;

  IF suggested_stage IS DISTINCT FROM p_stage THEN
    RAISE EXCEPTION 'La etapa solicitada no coincide con la sugerencia de Gmail';
  END IF;

  IF event_application_id IS NOT NULL
     AND event_application_id IS DISTINCT FROM p_application_id THEN
    RAISE EXCEPTION 'Este correo ya está vinculado a otra candidatura';
  END IF;

  IF suggestion_application_id IS NOT NULL
     AND suggestion_application_id IS DISTINCT FROM p_application_id THEN
    RAISE EXCEPTION 'Esta sugerencia pertenece a otra candidatura';
  END IF;

  IF suggestion_status = 'applied'
     AND suggestion_application_id = p_application_id
     AND event_application_id = p_application_id
     AND previous_stage = suggested_stage THEN
    RETURN;
  END IF;

  IF suggestion_status = 'applied' THEN
    RAISE EXCEPTION 'Esta sugerencia ya ha sido resuelta';
  END IF;

  UPDATE public.applications
  SET stage = suggested_stage,
      updated_at = now()
  WHERE id = p_application_id;

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
    'stage',
    CASE WHEN p_automatic
      THEN 'Estado actualizado automáticamente'
      ELSE 'Estado actualizado'
    END,
    COALESCE(previous_stage::text, '—') || ' → ' || suggested_stage::text || ' · ' || COALESCE(event_subject, 'Gmail'),
    'email'
  FROM public.email_events
  WHERE id = p_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_email_stage_suggestion(uuid, uuid, uuid, public.app_stage, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_email_stage_suggestion(uuid, uuid, uuid, public.app_stage, boolean) TO authenticated;

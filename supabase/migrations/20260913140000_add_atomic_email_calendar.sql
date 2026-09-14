ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS email_event_id uuid
  REFERENCES public.email_events(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_email_event_key
  ON public.calendar_events (email_event_id)
  WHERE email_event_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.apply_email_calendar_suggestion(
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
  application_user_id uuid;
  suggestion_user_id uuid;
  suggestion_event_id uuid;
  suggestion_application_id uuid;
  suggestion_status text;
  suggestion_kind text;
  suggestion_payload jsonb;
  event_title text;
  event_starts_at timestamptz;
  event_kind public.event_kind;
  event_duration integer;
  event_location text;
  event_notes text;
BEGIN
  SELECT user_id, application_id
  INTO event_user_id, event_application_id
  FROM public.email_events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el correo indicado';
  END IF;

  SELECT user_id
  INTO application_user_id
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró la candidatura indicada';
  END IF;

  SELECT user_id, email_event_id, application_id, status, kind, payload
  INTO suggestion_user_id, suggestion_event_id, suggestion_application_id,
       suggestion_status, suggestion_kind, suggestion_payload
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
    RAISE EXCEPTION 'No puedes aplicar este evento de Gmail';
  END IF;

  IF suggestion_kind IS DISTINCT FROM 'calendar' THEN
    RAISE EXCEPTION 'La sugerencia no es de calendario';
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
     AND event_application_id = p_application_id THEN
    RETURN;
  END IF;

  IF suggestion_status = 'applied' THEN
    RAISE EXCEPTION 'Esta sugerencia ya ha sido resuelta';
  END IF;

  IF suggestion_payload IS NULL
     OR suggestion_payload ->> 'starts_at' IS NULL THEN
    RAISE EXCEPTION 'La sugerencia no contiene una fecha válida';
  END IF;

  BEGIN
    event_starts_at := (suggestion_payload ->> 'starts_at')::timestamptz;
    event_kind := COALESCE((suggestion_payload ->> 'kind')::public.event_kind, 'interview');
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Los datos de calendario de la sugerencia no son válidos';
  END;

  event_title := COALESCE(suggestion_payload ->> 'title', 'Evento de Gmail');
  event_duration := COALESCE((suggestion_payload ->> 'duration_min')::integer, 45);
  event_location := suggestion_payload ->> 'location';
  event_notes := suggestion_payload ->> 'notes';

  INSERT INTO public.calendar_events (
    user_id,
    application_id,
    email_event_id,
    title,
    kind,
    starts_at,
    duration_min,
    location,
    notes
  )
  VALUES (
    auth.uid(),
    p_application_id,
    p_event_id,
    event_title,
    event_kind,
    event_starts_at,
    event_duration,
    event_location,
    event_notes
  );

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
  VALUES (
    auth.uid(),
    p_application_id,
    p_event_id,
    'calendar',
    'Evento añadido al calendario',
    event_title || ' · ' || event_starts_at::text,
    'email'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_email_calendar_suggestion(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_email_calendar_suggestion(uuid, uuid, uuid) TO authenticated;

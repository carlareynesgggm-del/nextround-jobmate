DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.email_suggestions
    GROUP BY email_event_id, kind
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'No se puede crear la unicidad de email_suggestions: existen duplicados por email_event_id y kind';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.activity_feed
    WHERE email_event_id IS NOT NULL
    GROUP BY email_event_id, kind, title
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'No se puede crear la unicidad de activity_feed: existen acciones Gmail duplicadas';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS email_suggestions_event_kind_key
  ON public.email_suggestions (email_event_id, kind);

CREATE UNIQUE INDEX IF NOT EXISTS activity_feed_email_action_key
  ON public.activity_feed (email_event_id, kind, title)
  WHERE email_event_id IS NOT NULL;

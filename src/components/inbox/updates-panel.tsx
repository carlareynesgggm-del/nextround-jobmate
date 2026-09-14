import { useState } from "react";
import { Check, Mail, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useApplications } from "@/lib/api";
import {
  useEmailEvents,
  useEmailSuggestions,
  useIgnoreEmailEvent,
  useMatchEmailEvent,
} from "@/lib/inbox/api";
import { useApplyEmailSuggestions } from "@/lib/inbox/apply";
import {
  EMAIL_TYPE_LABEL,
  SUGGESTION_KIND_LABEL,
  confidenceLabel,
  type EmailEventRow,
  type EmailType,
} from "@/lib/inbox/domain";
import { fmtDateTime } from "@/lib/format";
import { UNKNOWN } from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Novedades detectadas en el correo. Nada se aplica sin confirmación explícita. */
export function UpdatesPanel() {
  const t = useT();
  const { data: events = [] } = useEmailEvents("pending");

  if (events.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {t("Novedades detectadas en tu correo")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("{n} sin revisar", { n: events.length })}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("Revisa lo que ha encontrado NextRound. Solo se guarda lo que tú marques.")}
      </p>
      <ul className="space-y-3">
        {events.slice(0, 5).map((event) => (
          <EmailEventCard key={event.id} event={event} />
        ))}
      </ul>
    </section>
  );
}

function EmailEventCard({ event }: { event: EmailEventRow }) {
  const t = useT();
  const { data: suggestions = [] } = useEmailSuggestions(event.id);
  const { data: applications = [] } = useApplications();
  const apply = useApplyEmailSuggestions();
  const ignore = useIgnoreEmailEvent();
  const match = useMatchEmailEvent();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pending = suggestions.filter((item) => item.status === "pending");
  const chosen = pending.filter((item) => selected.has(item.id));
  const needsMatch = !event.application_id;
  const typeLabel = event.email_type
    ? t(EMAIL_TYPE_LABEL[event.email_type as EmailType] ?? event.email_type)
    : UNKNOWN;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirm() {
    if (chosen.length === 0) {
      toast.error(t("Marca al menos un cambio para guardarlo."));
      return;
    }
    try {
      await apply.mutateAsync({ event, suggestions: chosen });
      toast.success(t("Cambios guardados"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo guardar"));
    }
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Mail className="size-3.5" />
        <span className="rounded-full border border-border px-2 py-0.5 font-medium">{typeLabel}</span>
        <span>
          {t("Confianza")}: {t(confidenceLabel(event.confidence === null ? null : Number(event.confidence)))}
        </span>
        <span>· {fmtDateTime(event.received_at)}</span>
      </div>

      <p className="mt-2 text-sm font-medium leading-snug">{event.subject ?? UNKNOWN}</p>
      <p className="text-xs text-muted-foreground">
        {event.from_name ?? event.from_email ?? UNKNOWN}
      </p>
      {event.snippet && <p className="mt-2 text-sm text-muted-foreground">{event.snippet}</p>}

      {needsMatch ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm">{t("¿A qué candidatura corresponde este correo?")}</p>
          <select
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm"
            defaultValue=""
            onChange={(changeEvent) => {
              const applicationId = changeEvent.target.value;
              if (applicationId) void match.mutateAsync({ eventId: event.id, applicationId });
            }}
          >
            <option value="">{t("Elige una candidatura…")}</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {(app.companies?.name ?? UNKNOWN) + " · " + app.role_title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {pending.length > 0 && (
        <ul className="mt-4 space-y-2">
          {pending.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onClick={() => toggle(suggestion.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  selected.has(suggestion.id)
                    ? "border-violet/40 bg-violet/5"
                    : "border-border hover:bg-accent/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                    selected.has(suggestion.id)
                      ? "border-violet bg-violet text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {selected.has(suggestion.id) && <Check className="size-3" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{suggestion.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {suggestion.detail ?? t(SUGGESTION_KIND_LABEL[suggestion.kind as never] ?? suggestion.kind)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" className="gap-1.5" onClick={confirm} disabled={apply.isPending}>
          <Check className="size-3.5" />
          {t("Guardar lo marcado")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => void ignore.mutateAsync(event.id)}
          disabled={ignore.isPending}
        >
          <X className="size-3.5" /> {t("Descartar")}
        </Button>
      </div>
    </li>
  );
}

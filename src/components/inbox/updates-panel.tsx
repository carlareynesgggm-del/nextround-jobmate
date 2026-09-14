import { useState } from "react";
import { Check, Mail, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApplicationDialog } from "@/components/application-dialog";
import { useApplications } from "@/lib/api";
import {
  useEmailEvents,
  useEmailSuggestions,
  useIgnoreEmailEvent,
  useMatchEmailEvent,
  useResolveEmailApplication,
} from "@/lib/inbox/api";
import { useApplyEmailSuggestions } from "@/lib/inbox/apply";
import {
  EMAIL_TYPE_LABEL,
  SUGGESTION_KIND_LABEL,
  confidenceLabel,
  extractedOf,
  type EmailEventRow,
  type EmailType,
} from "@/lib/inbox/domain";
import type { ApplicationSeed } from "@/components/add/types";
import { fmtDateTime } from "@/lib/format";
import { STAGE_META, UNKNOWN } from "@/lib/domain";
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
  const resolveCreated = useResolveEmailApplication();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editOpen, setEditOpen] = useState(false);

  const pending = suggestions.filter((item) => item.status === "pending");
  const newApplication = pending.find((item) => item.kind === "new_application");
  const otherPending = pending.filter((item) => item.kind !== "new_application");
  const chosen = pending.filter((item) => selected.has(item.id));
  const needsMatch = !event.application_id;
  const extracted = extractedOf(event);
  const [seed, setSeed] = useState<ApplicationSeed | undefined>();
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

  async function confirm(items = chosen) {
    if (items.length === 0) {
      toast.error(t("Marca al menos un cambio para guardarlo."));
      return;
    }
    try {
      await apply.mutateAsync({ event, suggestions: items });
      toast.success(t("Cambios guardados"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo guardar"));
    }
  }

  function editBeforeAdd() {
    if (!newApplication) return;
    const payload = (newApplication.payload ?? {}) as Record<string, unknown>;
    const text = (value: unknown): string | null =>
      typeof value === "string" && value.trim() ? value.trim() : null;
    setSeed({
      company: text(payload.company) ?? extracted.company,
      roleTitle: text(payload.role_title) ?? extracted.role ?? event.subject,
      stage: (text(payload.stage) ?? extracted.stage) as ApplicationSeed["stage"],
      appliedAt: text(payload.applied_at),
      jobUrl: text(payload.job_url),
      candidatePortalUrl: text(payload.candidate_portal_url) ?? extracted.portal_url,
      applicationRef: text(payload.application_ref) ?? extracted.application_ref,
      source: text(payload.source) ?? "email",
    });
    setEditOpen(true);
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
          {newApplication ? (
            <div className="rounded-xl border border-violet/25 bg-violet/5 p-3">
              <p className="text-sm font-medium">{t("Nueva candidatura detectada")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[extracted.company, extracted.role].filter(Boolean).join(" · ") || event.subject || UNKNOWN}
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => void confirm([newApplication])}
                disabled={apply.isPending}
              >
                {t("Añadir candidatura")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="ml-2 mt-3"
                onClick={editBeforeAdd}
              >
                {t("Editar antes de añadir")}
              </Button>
            </div>
          ) : null}
          <p className="text-sm">
            {newApplication
              ? t("¿A qué candidatura corresponde este correo si no es una nueva?")
              : t("¿A qué candidatura corresponde este correo?")}
          </p>
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
                {(app.companies?.name ?? UNKNOWN) +
                  " · " +
                  app.role_title +
                  " · " +
                  (STAGE_META[app.stage]?.label ?? app.stage) +
                  (app.applied_at ? ` · ${app.applied_at}` : "")}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {otherPending.length > 0 && (
        <ul className="mt-4 space-y-2">
          {otherPending.map((suggestion) => (
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
      <ApplicationDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialSeed={seed}
        onCreated={async (applicationId) => {
          await resolveCreated.mutateAsync({
            eventId: event.id,
            suggestionId: newApplication!.id,
            applicationId,
          });
          toast.success(t("Candidatura creada y correo vinculado"));
        }}
      />
    </li>
  );
}

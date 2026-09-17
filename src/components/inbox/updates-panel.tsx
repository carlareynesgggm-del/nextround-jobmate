import { useMemo, useState } from "react";
import { ArrowRight, CalendarPlus, Check, Link2, Mail, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  extractedOf,
  type EmailEventRow,
  type EmailSuggestionRow,
  type EmailType,
} from "@/lib/inbox/domain";
import { fmtDateTime } from "@/lib/format";
import { STAGES, STAGE_META, UNKNOWN, type Stage } from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Sugerencias que representan una fecha para el calendario. */
const DATE_KINDS = new Set(["calendar", "interview", "assessment", "deadline"]);

/** Novedades detectadas en el correo. Nada se aplica sin confirmación explícita. */
export function UpdatesPanel() {
  const t = useT();
  const { data: all = [] } = useEmailEvents();
  const events = useMemo(
    () => all.filter((event) => event.status === "pending" || event.status === "needs_match"),
    [all],
  );

  if (events.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {t("Novedades detectadas en tu correo")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("{n} sin revisar", { n: events.length })}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("Revisa lo que ha encontrado NextRound. Solo se guarda lo que tú confirmes.")}
      </p>
      <ul className="space-y-3">
        {events.slice(0, 6).map((event) => (
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

  const extracted = extractedOf(event);
  const pending = suggestions.filter((item) => item.status === "pending");
  const newApp = pending.find((item) => item.kind === "new_application") ?? null;
  const stageSuggestion = pending.find((item) => item.kind === "stage") ?? null;
  const dateSuggestions = pending.filter((item) => DATE_KINDS.has(item.kind));
  const others = pending.filter(
    (item) => item !== newApp && item !== stageSuggestion && !DATE_KINDS.has(item.kind),
  );
  const chosen = others.filter((item) => selected.has(item.id));

  const linked = applications.find((app) => app.id === event.application_id) ?? null;
  const candidateIds = extracted.match_candidates ?? [];
  const candidates = applications.filter((app) => candidateIds.includes(app.id));
  const needsMatch = !event.application_id && !newApp;

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

  /** Aplica solo las sugerencias indicadas, siempre tras confirmación. */
  async function run(items: EmailSuggestionRow[], successMessage: string) {
    if (items.length === 0) {
      toast.error(t("No hay nada marcado para guardar."));
      return;
    }
    try {
      await apply.mutateAsync({ event, suggestions: items });
      toast.success(t(successMessage));
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
        <span className="rounded-full border border-border px-2 py-0.5">{t("Origen: Gmail")}</span>
      </div>

      <p className="mt-2 text-sm font-medium leading-snug">{event.subject ?? UNKNOWN}</p>
      <p className="text-xs text-muted-foreground">
        {event.from_name ?? event.from_email ?? UNKNOWN}
      </p>
      {event.snippet && <p className="mt-2 text-sm text-muted-foreground">{event.snippet}</p>}

      {linked ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3.5" />
          {t("Vinculado a")}: {(linked.companies?.name ?? UNKNOWN) + " · " + linked.role_title}
        </p>
      ) : null}

      {needsMatch ? (
        <MatchBlock
          candidates={candidates}
          applications={applications}
          pending={match.isPending}
          onLink={(applicationId) => void match.mutateAsync({ eventId: event.id, applicationId })}
        />
      ) : null}

      {newApp ? (
        <NewApplicationBlock
          suggestion={newApp}
          busy={apply.isPending}
          onAdd={(patched) => void run([patched], "Candidatura creada")}
          onIgnore={() => void ignore.mutateAsync(event.id)}
        />
      ) : null}

      {stageSuggestion ? (
        <StageBlock
          suggestion={stageSuggestion}
          currentStage={(linked?.stage as Stage | undefined) ?? null}
          busy={apply.isPending}
          onUpdate={(patched) => void run([patched], "Candidatura actualizada")}
        />
      ) : null}

      {dateSuggestions.length > 0 ? (
        <div className="mt-4 rounded-xl border border-info/25 bg-info/5 p-4">
          <p className="text-sm font-medium">{t("Este correo contiene una nueva fecha importante.")}</p>
          <ul className="mt-2 space-y-2">
            {dateSuggestions.map((suggestion) => (
              <li key={suggestion.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 text-sm">
                  <span className="block font-medium">{suggestion.label}</span>
                  {suggestion.detail && (
                    <span className="block text-xs text-muted-foreground">{suggestion.detail}</span>
                  )}
                </span>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={apply.isPending}
                  onClick={() => void run([suggestion], "Añadido a tu calendario")}
                >
                  <CalendarPlus className="size-3.5" /> {t("Añadir al calendario")}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {others.length > 0 && (
        <>
          <p className="mt-4 text-sm font-medium">{t("Otros datos detectados")}</p>
          <ul className="mt-2 space-y-2">
            {others.map((suggestion) => (
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
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {others.length > 0 && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => void run(chosen, "Cambios guardados")}
            disabled={apply.isPending}
          >
            <Check className="size-3.5" />
            {t("Guardar lo marcado")}
          </Button>
        )}
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

/* ------------------------- correo sin candidatura clara ------------------- */

type MiniApp = { id: string; role_title: string; companies: { name: string } | null };

function MatchBlock({
  candidates,
  applications,
  pending,
  onLink,
}: {
  candidates: MiniApp[];
  applications: MiniApp[];
  pending: boolean;
  onLink: (applicationId: string) => void;
}) {
  const t = useT();
  return (
    <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-4">
      <p className="text-sm font-medium">{t("¿A qué candidatura pertenece este correo?")}</p>
      {candidates.length > 0 ? (
        <ul className="space-y-2">
          {candidates.map((app) => (
            <li key={app.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">
                {(app.companies?.name ?? UNKNOWN) + " · " + app.role_title}
              </span>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => onLink(app.id)}>
                {t("Vincular")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <select
        className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm"
        defaultValue=""
        onChange={(changeEvent) => {
          const applicationId = changeEvent.target.value;
          if (applicationId) onLink(applicationId);
        }}
      >
        <option value="">{t("Elegir otra candidatura…")}</option>
        {applications.map((app) => (
          <option key={app.id} value={app.id}>
            {(app.companies?.name ?? UNKNOWN) + " · " + app.role_title}
          </option>
        ))}
      </select>
    </div>
  );
}

/* --------------------------- nueva candidatura ---------------------------- */

function NewApplicationBlock({
  suggestion,
  busy,
  onAdd,
  onIgnore,
}: {
  suggestion: EmailSuggestionRow;
  busy: boolean;
  onAdd: (patched: EmailSuggestionRow) => void;
  onIgnore: () => void;
}) {
  const t = useT();
  const payload = (suggestion.payload ?? {}) as Record<string, unknown>;
  const value = (key: string) => (typeof payload[key] === "string" ? (payload[key] as string) : "");
  const [editing, setEditing] = useState(false);
  const [company, setCompany] = useState(value("company"));
  const [role, setRole] = useState(value("role_title"));
  const [stage, setStage] = useState<Stage>((value("stage") || "applied") as Stage);

  function submit() {
    if (!role.trim()) {
      toast.error(t("Indica el puesto antes de crear la candidatura."));
      return;
    }
    onAdd({
      ...suggestion,
      payload: { ...payload, company: company.trim() || null, role_title: role.trim(), stage },
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-violet/30 bg-violet/5 p-4">
      <p className="text-sm font-medium">{t("Nueva candidatura detectada")}</p>
      {editing ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            {t("Empresa")}
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            {t("Puesto")}
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            {t("Estado")}
            <select
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
            >
              {STAGES.map((option) => (
                <option key={option} value={option}>
                  {t(STAGE_META[option].label)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <Row label={t("Empresa")} value={company || UNKNOWN} />
          <Row label={t("Puesto")} value={role || UNKNOWN} />
          <Row label={t("Estado")} value={t(STAGE_META[stage]?.label ?? stage)} />
          {value("job_url") ? <Row label={t("Oferta")} value={value("job_url")} /> : null}
          {value("candidate_portal_url") ? (
            <Row label={t("Portal")} value={value("candidate_portal_url")} />
          ) : null}
        </dl>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" className="gap-1.5" disabled={busy} onClick={submit}>
          <Plus className="size-3.5" /> {t("Añadir candidatura")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => setEditing((current) => !current)}
        >
          <Pencil className="size-3.5" />
          {editing ? t("Ocultar edición") : t("Editar antes de añadir")}
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={onIgnore}>
          <X className="size-3.5" /> {t("Ignorar")}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------- actualización de la fase ----------------------- */

function StageBlock({
  suggestion,
  currentStage,
  busy,
  onUpdate,
}: {
  suggestion: EmailSuggestionRow;
  currentStage: Stage | null;
  busy: boolean;
  onUpdate: (patched: EmailSuggestionRow) => void;
}) {
  const t = useT();
  const payload = (suggestion.payload ?? {}) as Record<string, unknown>;
  const proposed = (typeof payload["stage"] === "string" ? payload["stage"] : "applied") as Stage;
  const [editing, setEditing] = useState(false);
  const [stage, setStage] = useState<Stage>(proposed);

  return (
    <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
      <p className="text-sm font-medium">{t("Nueva actualización detectada")}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs">
          {currentStage ? t(STAGE_META[currentStage].label) : UNKNOWN}
        </span>
        <ArrowRight className="size-3.5 text-muted-foreground" />
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium">
          {t(STAGE_META[stage]?.label ?? stage)}
        </span>
      </div>
      {suggestion.detail && (
        <p className="mt-2 text-xs text-muted-foreground">{suggestion.detail}</p>
      )}
      {editing && (
        <select
          className="mt-3 h-9 w-full rounded-xl border border-border bg-background px-3 text-sm sm:max-w-xs"
          value={stage}
          onChange={(e) => setStage(e.target.value as Stage)}
        >
          {STAGES.map((option) => (
            <option key={option} value={option}>
              {t(STAGE_META[option].label)}
            </option>
          ))}
        </select>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => onUpdate({ ...suggestion, payload: { ...payload, stage } })}
        >
          <Check className="size-3.5" /> {t("Actualizar candidatura")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => setEditing((current) => !current)}
        >
          <Pencil className="size-3.5" />
          {editing ? t("Ocultar edición") : t("Editar antes de actualizar")}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 gap-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate">{value}</dd>
    </div>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Check, Clock, Mail, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui-bits";
import { useApplications } from "@/lib/api";
import {
  useAllPendingSuggestions,
  useEmailEvents,
  useIgnoreEmailEvents,
  useMatchEmailEvent,
  useSnoozeEmailEvent,
} from "@/lib/inbox/api";
import { useApplyEmailSuggestions } from "@/lib/inbox/apply";
import { groupProcesses, type DetectedProcess } from "@/lib/inbox/grouping";
import { useGmailActions } from "@/lib/inbox/use-gmail";
import {
  EMAIL_TYPE_LABEL,
  extractedOf,
  type EmailEventRow,
  type EmailType,
} from "@/lib/inbox/domain";
import { STAGE_META, UNKNOWN, type Stage } from "@/lib/domain";
import { fmtDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [
      { title: "Procesos detectados en tu correo — NextRound" },
      {
        name: "description",
        content:
          "Revisa las candidaturas y novedades que NextRound ha detectado en tu correo y confirma en bloque lo que quieras guardar.",
      },
      { property: "og:title", content: "Procesos detectados en tu correo — NextRound" },
      {
        property: "og:description",
        content: "Añade, actualiza o ignora los procesos detectados en tu correo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InboxPage,
});

const OPEN_STATUSES = new Set(["pending", "needs_match"]);

function InboxPage() {
  const t = useT();
  const { gmail, busy, lastResult, startConnect, runSync } = useGmailActions({
    autoInitialScan: true,
  });
  const { data: allEvents = [], isLoading } = useEmailEvents();
  const { data: suggestions = [] } = useAllPendingSuggestions();
  const [showSnoozed, setShowSnoozed] = useState(false);

  const events = useMemo(
    () =>
      allEvents.filter((event) =>
        showSnoozed ? event.status === "snoozed" : OPEN_STATUSES.has(event.status ?? ""),
      ),
    [allEvents, showSnoozed],
  );
  const snoozedCount = allEvents.filter((event) => event.status === "snoozed").length;
  const processes = useMemo(() => groupProcesses(events, suggestions), [events, suggestions]);

  const connected = gmail?.status === "connected";
  const scanning = busy === "sync";

  if (!connected) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={t("Novedades de tu correo")}
          description={t(
            "NextRound revisa tus últimos 60 días de correo y te propone candidaturas y novedades. Nada se guarda sin tu confirmación.",
          )}
        />
        <EmptyState
          icon={<Mail className="size-5" />}
          title={t("Conecta tu correo")}
          description={t(
            "NextRound puede detectar entrevistas, pruebas y respuestas relacionadas con tus candidaturas.",
          )}
          action={
            <Button className="gap-1.5" disabled={busy === "connect"} onClick={() => void startConnect("/inbox")}>
              <Mail className="size-4" /> {t("Conectar Gmail")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          processes.length > 0
            ? t("Hemos encontrado {n} procesos en tu correo", { n: processes.length })
            : t("Novedades de tu correo")
        }
        description={t(
          "NextRound revisa tus últimos 60 días de correo y te propone candidaturas y novedades. Nada se guarda sin tu confirmación.",
        )}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" disabled={scanning} onClick={() => void runSync()}>
            <RefreshCw className={scanning ? "size-3.5 animate-spin" : "size-3.5"} />
            {scanning ? t("Escaneando tu correo…") : t("Escanear de nuevo")}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border/60 pb-5 text-xs text-muted-foreground">
        <span>
          {gmail?.last_sync_at
            ? t("Última revisión: {date}", { date: fmtDateTime(gmail.last_sync_at) })
            : t("Sin revisiones todavía")}
        </span>
        {lastResult ? <span>· {t("{n} correos revisados", { n: lastResult.scanned })}</span> : null}
        {snoozedCount > 0 ? (
          <button
            type="button"
            className="rounded-md border border-border/70 px-2 py-0.5 transition-colors hover:bg-surface-2"
            onClick={() => setShowSnoozed((current) => !current)}
          >
            {showSnoozed
              ? t("Ver los pendientes de revisar")
              : t("Ver los {n} guardados para después", { n: snoozedCount })}
          </button>
        ) : null}
      </div>

      {scanning && processes.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-surface px-5 py-6 text-center text-sm text-muted-foreground">
          {t("Estamos revisando tu correo. Puedes seguir usando NextRound mientras termina.")}
        </div>
      ) : null}

      {isLoading ? null : processes.length === 0 && !scanning ? (
        <EmptyState
          icon={<Mail className="size-5" />}
          title={showSnoozed ? t("Nada guardado para después") : t("Nada pendiente de revisar")}
          description={t("Cuando llegue un correo de un proceso, aparecerá aquí como propuesta.")}
        />
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {processes.map((process) => (
            <ProcessCard key={process.key} process={process} />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------- proceso detectado -------------------------- */

function ProcessCard({ process }: { process: DetectedProcess }) {
  const t = useT();
  const { data: applications = [] } = useApplications();
  const apply = useApplyEmailSuggestions();
  const ignore = useIgnoreEmailEvents();
  const snooze = useSnoozeEmailEvent();
  const match = useMatchEmailEvent();

  const eventIds = process.events.map((event) => event.id);
  const linked = applications.find((app) => app.id === process.applicationId) ?? null;
  const newApp = process.suggestions.find((item) => item.kind === "new_application") ?? null;
  const stageSuggestion = process.suggestions.find((item) => item.kind === "stage") ?? null;
  const others = process.suggestions.filter(
    (item) => item.kind !== "new_application" && item.kind !== "activity",
  );
  const needsMatch = !process.applicationId && !newApp;

  const candidateIds = new Set(
    process.events.flatMap((event) => extractedOf(event).match_candidates ?? []),
  );
  const candidates = applications.filter((app) => candidateIds.has(app.id));

  const proposedStage =
    stageSuggestion && typeof (stageSuggestion.payload as Record<string, unknown>)?.["stage"] === "string"
      ? ((stageSuggestion.payload as Record<string, string>)["stage"] as Stage)
      : null;
  const busy = apply.isPending || ignore.isPending || snooze.isPending;

  /** Aplica las propuestas del proceso, correo a correo, tras confirmación. */
  async function confirm(kinds: "all" | "new") {
    try {
      for (const event of process.events) {
        const items = process.suggestions.filter(
          (item) =>
            item.email_event_id === event.id && (kinds === "all" || item.kind === "new_application"),
        );
        if (items.length === 0) continue;
        await apply.mutateAsync({ event, suggestions: items });
      }
      toast.success(kinds === "new" ? t("Candidatura creada") : t("Candidatura actualizada"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo guardar"));
    }
  }

  return (
    <li className="group overflow-hidden rounded-xl border border-border/70 bg-surface shadow-soft transition-all duration-200 hover:border-primary/20 hover:shadow-lift">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] font-medium",
              process.isNew
                ? "border-primary/25 bg-primary/8 text-primary"
                : "border-border/70 bg-surface-2 text-muted-foreground",
            )}
          >
            <span className={cn("size-1.5 rounded-full", process.isNew ? "bg-primary" : "bg-info")} />
            {process.isNew ? t("Nueva candidatura detectada") : t("Novedad en una candidatura")}
          </span>
          <h3 className="mt-2.5 font-display text-[16px] font-semibold">
            {linked
              ? `${linked.companies?.name ?? UNKNOWN} · ${linked.role_title}`
              : `${process.company ?? UNKNOWN} · ${process.role ?? UNKNOWN}`}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("{n} correos de este proceso", { n: process.events.length })}
            {process.lastReceivedAt ? ` · ${fmtDateTime(process.lastReceivedAt)}` : ""}
          </p>
        </div>
        {proposedStage ? (
          <span className="shrink-0 rounded-md border border-border/70 bg-surface-2 px-2 py-[3px] text-[11px] font-medium text-muted-foreground">
            {t("Propone")}: {t(STAGE_META[proposedStage]?.label ?? proposedStage)}
          </span>
        ) : null}
      </div>

      <ul className="divide-y divide-border/60 border-y border-border/60">
        {process.events.slice(0, 3).map((event) => (
          <EmailLine key={event.id} event={event} />
        ))}
      </ul>

      {others.length > 0 ? (
        <ul className="space-y-2 bg-accent/25 px-5 py-4 text-[13px]">
          {others.map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <Check className="mt-[3px] size-3.5 shrink-0 text-primary" />
              <span>
                <span className="font-medium">{item.label}</span>
                {item.detail ? (
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {needsMatch ? (
        <div className="border-t border-border/60 px-5 py-4">
          <p className="text-[13px] font-medium">{t("¿A qué candidatura pertenece este proceso?")}</p>
          <select
            className="mt-2 h-9 w-full rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:border-ring/50 focus-visible:ring-[3px] focus-visible:ring-ring/15"
            defaultValue=""
            onChange={(changeEvent) => {
              const applicationId = changeEvent.target.value;
              if (!applicationId) return;
              for (const id of eventIds) {
                void match.mutateAsync({ eventId: id, applicationId });
              }
            }}
          >
            <option value="">{t("Elegir candidatura…")}</option>
            {[...candidates, ...applications.filter((app) => !candidateIds.has(app.id))].map((app) => (
              <option key={app.id} value={app.id}>
                {(app.companies?.name ?? UNKNOWN) + " · " + app.role_title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-5 py-3.5">
        {process.isNew ? (
          <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => void confirm("new")}>
            <Plus className="size-3.5" /> {t("Añadir")}
          </Button>
        ) : null}
        {process.suggestions.length > 0 && !process.isNew ? (
          <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => void confirm("all")}>
            <Check className="size-3.5" /> {t("Actualizar")}
          </Button>
        ) : null}
        {process.isNew && process.suggestions.length > 1 ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={busy}
            onClick={() => void confirm("all")}
          >
            <Check className="size-3.5" /> {t("Añadir con todos los datos")}
          </Button>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            disabled={busy}
            onClick={() => void snooze.mutateAsync(eventIds)}
          >
            <Clock className="size-3.5" /> {t("Revisar después")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            disabled={busy}
            onClick={() => void ignore.mutateAsync(eventIds)}
          >
            <X className="size-3.5" /> {t("Ignorar")}
          </Button>
          {linked ? (
            <a
              href={`/applications/${linked.id}`}
              className="inline-flex items-center gap-1 px-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("Abrir candidatura")} <ArrowUpRight className="size-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function EmailLine({ event }: { event: EmailEventRow }) {
  const t = useT();
  const typeLabel = event.email_type
    ? t(EMAIL_TYPE_LABEL[event.email_type as EmailType] ?? event.email_type)
    : UNKNOWN;
  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Mail className="size-3" />
        <span className="rounded-md border border-border/70 bg-surface-2 px-1.5 py-[1px] font-medium">
          {typeLabel}
        </span>
        <span className="truncate">{event.from_name ?? event.from_email ?? UNKNOWN}</span>
      </div>
      <p className="mt-1 text-[13px]">{event.subject ?? UNKNOWN}</p>
    </li>
  );
}

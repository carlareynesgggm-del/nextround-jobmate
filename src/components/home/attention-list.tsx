import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { CompanyMark } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import type { ApplicationWithCompany, CalendarRow } from "@/lib/domain";
import { UNKNOWN } from "@/lib/domain";
import type { NextAction } from "@/lib/next-action";
import { fmtTime, relativeDay, toDate } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const WEEKDAY = new Intl.DateTimeFormat("es-ES", { weekday: "long" });

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function whenLabel(event: CalendarRow | undefined): string | null {
  if (!event) return null;
  const date = toDate(event.starts_at);
  if (!date) return null;
  const diff = Math.round((date.getTime() - Date.now()) / 86_400_000);
  const day = diff <= 1 ? relativeDay(event.starts_at) : capitalize(WEEKDAY.format(date));
  const time = fmtTime(event.starts_at);
  return `${day} · ${time}`;
}

function factLabel(action: NextAction, event: CalendarRow | undefined): string {
  if (event?.title) return event.title;
  switch (action.kind) {
    case "assessment":
      return "Prueba pendiente";
    case "interview":
      return "Entrevista";
    case "offer":
      return "Decisión de oferta pendiente";
    case "followup":
    case "ghosted":
      return action.label;
    case "cv":
      return "Falta el CV enviado";
    case "jd":
      return "Falta la descripción de la oferta";
    case "portal":
      return "Falta el portal del candidato";
    case "notes":
      return "Notas de entrevista pendientes";
    default:
      return action.label;
  }
}

function aiPrompt(app: ApplicationWithCompany, action: NextAction, fact: string): string {
  const company = app.companies?.name ?? app.role_title;
  switch (action.kind) {
    case "assessment":
      return `Ayúdame a preparar la prueba de ${app.role_title} en ${company}.`;
    case "interview":
      return `Ayúdame a preparar la entrevista de ${app.role_title} en ${company}.`;
    case "offer":
      return `Ayúdame a decidir sobre la oferta de ${app.role_title} en ${company}.`;
    case "followup":
    case "ghosted":
      return `Redacta un email breve de seguimiento para ${app.role_title} en ${company}.`;
    default:
      return `Ayúdame con el siguiente paso de ${app.role_title} en ${company}: ${fact}.`;
  }
}

function openAssistant(applicationId: string, prompt: string) {
  window.dispatchEvent(new CustomEvent("nextround:ai", { detail: { applicationId, prompt } }));
}

const TAB_BY_KIND: Partial<Record<NextAction["kind"], string>> = {
  cv: "documents",
  jd: "job",
  notes: "notes",
  assessment: "process",
  interview: "process",
};

const PRIMARY_LABEL: Partial<Record<NextAction["kind"], string>> = {
  cv: "Vincular CV",
  jd: "Añadir descripción",
  notes: "Añadir notas",
  portal: "Añadir portal",
};

export function AttentionCard({
  app,
  action,
  event,
}: {
  app: ApplicationWithCompany;
  action: NextAction;
  event?: CalendarRow;
}) {
  const t = useT();
  const fact = factLabel(action, event);
  const when = whenLabel(event);
  const company = app.companies?.name ?? UNKNOWN;
  const isFollowup = action.kind === "followup" || action.kind === "ghosted";
  const urgent = action.tone === "red" || action.tone === "amber";

  const primaryLabel = PRIMARY_LABEL[action.kind];
  const primary = primaryLabel ? (
    <Button asChild size="sm">
      <Link to="/applications/$id" params={{ id: app.id }} hash={TAB_BY_KIND[action.kind] ?? "overview"}>
        {t(primaryLabel)}
      </Link>
    </Button>
  ) : (
    <Button
      size="sm"
      className="gap-1.5"
      onClick={() =>
        openAssistant(
          app.id,
          isFollowup
            ? `Redacta un email breve de seguimiento para ${app.role_title} en ${company}.`
            : aiPrompt(app, action, fact),
        )
      }
    >
      <Sparkles className="size-3.5" /> {t(isFollowup ? "Redactar seguimiento" : "Preparar con IA")}
    </Button>
  );

  return (
    <li className="group relative overflow-hidden rounded-xl border border-border/70 bg-surface px-4 py-3.5 transition-all duration-200 hover:border-border hover:bg-surface-2/40">
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[2px]",
          urgent ? "bg-primary/70" : "bg-transparent",
        )}
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <CompanyMark name={company} size="sm" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {company} · {app.role_title}
          </p>
          <p className="mt-1 truncate font-display text-[14px] font-semibold tracking-tight">
            {t(fact)}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {when ?? t(action.detail)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {primary}
          <Link
            to="/applications/$id"
            params={{ id: app.id }}
            aria-label={t("Ver candidatura")}
            title={t("Ver candidatura")}
            className="rounded-md p-1.5 text-muted-foreground/60 opacity-0 transition-all duration-200 hover:bg-surface-2 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </li>
  );
}

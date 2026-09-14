import { Link } from "@tanstack/react-router";
import { ExternalLink, Sparkles } from "lucide-react";

import { CompanyMark } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import type { ApplicationWithCompany, CalendarRow } from "@/lib/domain";
import { UNKNOWN } from "@/lib/domain";
import type { NextAction } from "@/lib/next-action";
import { nextActionTone } from "@/lib/next-action";
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
  const secondary = app.candidate_portal_url ? (
    <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-xl">
      <a href={app.candidate_portal_url} target="_blank" rel="noreferrer">
        {t("Abrir portal")} <ExternalLink className="size-3.5" />
      </a>
    </Button>
  ) : isFollowup ? (
    <Button
      size="sm"
      variant="outline"
      className="rounded-xl"
      onClick={() => openAssistant(app.id, `Redacta un email breve de seguimiento para ${app.role_title} en ${company}.`)}
    >
      {t("Redactar seguimiento")}
    </Button>
  ) : (
    <Button asChild size="sm" variant="outline" className="rounded-xl">
      <Link to="/applications/$id" params={{ id: app.id }}>
        {t("Ver candidatura")}
      </Link>
    </Button>
  );

  return (
    <li className="rounded-3xl bg-surface p-6 shadow-soft transition-shadow hover:shadow-lift sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <CompanyMark name={company} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold tracking-tight">{company}</p>
            <p className="truncate text-sm text-muted-foreground">{app.role_title}</p>
          </div>
        </div>
        {when && (
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
              nextActionTone(action.tone),
            )}
          >
            {when}
          </span>
        )}
      </div>

      <p className="mt-5 text-base font-medium leading-snug">{t(fact)}</p>
      {!when && <p className="mt-1 text-sm text-muted-foreground">{t(action.detail)}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Button
          size="sm"
          className="gap-1.5 rounded-xl"
          onClick={() => openAssistant(app.id, aiPrompt(app, action, fact))}
        >
          <Sparkles className="size-3.5" /> {t("Preparar con IA")}
        </Button>
        {secondary}
      </div>
    </li>
  );
}

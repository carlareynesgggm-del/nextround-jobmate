import type { AppDocumentWithDoc, ApplicationWithCompany, CalendarRow, TimelineRow } from "@/lib/domain";
import { CLOSED_STAGES } from "@/lib/domain";
import { daysSinceApplied } from "@/lib/alerts";
import { fmtDate, relativeDay, toDate } from "@/lib/format";

export type NextActionKind = "assessment" | "interview" | "followup" | "cv" | "notes" | "custom" | "review";

export type NextAction = {
  kind: NextActionKind;
  /** Titular corto: "Completa la prueba antes del 8 sep". */
  label: string;
  /** Contexto: "Prueba online de 30 min · Mañana". */
  detail: string;
  /** 0 = más urgente. */
  urgency: number;
  tone: "violet" | "amber" | "red" | "neutral";
  ctaLabel: string;
  href?: string | null;
};

const TONE_CLASS: Record<NextAction["tone"], string> = {
  violet: "bg-violet/10 text-violet border-violet/25",
  amber: "bg-warning/12 text-warning border-warning/25",
  red: "bg-danger/10 text-danger border-danger/25",
  neutral: "bg-secondary text-muted-foreground border-border",
};

export function nextActionTone(tone: NextAction["tone"]): string {
  return TONE_CLASS[tone];
}

type Ctx = {
  events?: CalendarRow[];
  timeline?: TimelineRow[];
  links?: AppDocumentWithDoc[];
};

/** Calcula la mejor siguiente acción de una candidatura activa. */
export function nextBestAction(app: ApplicationWithCompany, ctx: Ctx = {}): NextAction | null {
  if (CLOSED_STAGES.includes(app.stage)) return null;

  const now = Date.now();
  const events = (ctx.events ?? []).filter((event) => event.application_id === app.id);
  const timeline = (ctx.timeline ?? []).filter((row) => row.application_id === app.id);
  const links = (ctx.links ?? []).filter((link) => link.application_id === app.id);

  const future = events
    .map((event) => ({ event, at: toDate(event.starts_at)?.getTime() ?? 0 }))
    .filter((entry) => entry.at >= now - 3_600_000)
    .sort((a, b) => a.at - b.at);

  const test = future.find(({ event }) => event.kind === "test" || event.kind === "deadline");
  if (test) {
    const hours = (test.at - now) / 3_600_000;
    return {
      kind: "assessment",
      label: `Completa la prueba antes del ${fmtDate(test.event.starts_at)}`,
      detail: `${test.event.title} · ${relativeDay(test.event.starts_at)}${
        test.event.duration_min ? ` · ${test.event.duration_min} min` : ""
      }`,
      urgency: hours <= 48 ? 0 : 3,
      tone: hours <= 48 ? "red" : "amber",
      ctaLabel: app.candidate_portal_url ? "Abrir portal" : "Preparar",
      href: app.candidate_portal_url,
    };
  }

  const interview = future.find(({ event }) => event.kind === "interview" || event.kind === "call");
  if (interview) {
    const hours = (interview.at - now) / 3_600_000;
    return {
      kind: "interview",
      label: "Prepara la entrevista",
      detail: `${interview.event.title} · ${relativeDay(interview.event.starts_at)}`,
      urgency: hours <= 48 ? 1 : 4,
      tone: "violet",
      ctaLabel: "Preparar con IA",
    };
  }

  const days = daysSinceApplied(app);
  if (days !== null && days >= 14 && ["applied", "screening"].includes(app.stage)) {
    return {
      kind: "followup",
      label: `Haz seguimiento — ${days} días sin respuesta`,
      detail: "Un email breve al recruiter reactiva el proceso",
      urgency: 2,
      tone: "amber",
      ctaLabel: "Hacer seguimiento",
    };
  }

  if (app.stage !== "saved" && links.length === 0) {
    return {
      kind: "cv",
      label: "Sube el CV que usaste",
      detail: "Así podrás comparar qué versión funciona mejor",
      urgency: 6,
      tone: "neutral",
      ctaLabel: "Vincular CV",
    };
  }

  const pastInterview = timeline.find(
    (row) => row.kind === "interview" && !row.outcome && (toDate(row.occurred_at)?.getTime() ?? now) < now,
  );
  if (pastInterview) {
    return {
      kind: "notes",
      label: "Añade notas de la entrevista",
      detail: pastInterview.title,
      urgency: 5,
      tone: "neutral",
      ctaLabel: "Escribir notas",
    };
  }

  if (app.next_action) {
    return {
      kind: "custom",
      label: app.next_action,
      detail: app.next_action_at ? relativeDay(app.next_action_at) : "Sin fecha",
      urgency: 7,
      tone: "neutral",
      ctaLabel: "Ver candidatura",
    };
  }

  return {
    kind: "review",
    label: "Define tu próximo paso",
    detail: "Esta candidatura no tiene ninguna acción pendiente",
    urgency: 9,
    tone: "neutral",
    ctaLabel: "Ver candidatura",
  };
}

export type AttentionItem = {
  app: ApplicationWithCompany;
  action: NextAction;
};

/** Lo que de verdad necesita atención hoy, ordenado por urgencia. */
export function attentionFeed(
  applications: ApplicationWithCompany[],
  ctx: Ctx = {},
  limit = 4,
): AttentionItem[] {
  return applications
    .filter((app) => !app.archived && !CLOSED_STAGES.includes(app.stage))
    .map((app) => ({ app, action: nextBestAction(app, ctx) }))
    .filter((item): item is AttentionItem => !!item.action && item.action.urgency <= 6)
    .sort((a, b) => a.action.urgency - b.action.urgency)
    .slice(0, limit);
}

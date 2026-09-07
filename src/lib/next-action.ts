import type { AppDocumentWithDoc, ApplicationWithCompany, CalendarRow, TimelineRow } from "@/lib/domain";
import { CLOSED_STAGES } from "@/lib/domain";
import { daysSinceApplied } from "@/lib/alerts";
import { fmtDate, relativeDay, toDate } from "@/lib/format";

export type NextActionKind =
  | "assessment"
  | "interview"
  | "followup"
  | "offer"
  | "ghosted"
  | "cv"
  | "jd"
  | "portal"
  | "notes"
  | "custom"
  | "review";

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
  /** Umbral de días sin respuesta configurado en el perfil (por defecto 14). */
  followUpDays?: number;
};

/** Calcula la mejor siguiente acción de una candidatura. */
export function nextBestAction(app: ApplicationWithCompany, ctx: Ctx = {}): NextAction | null {
  if (CLOSED_STAGES.includes(app.stage) && app.stage !== "ghosted") return null;

  const now = Date.now();
  const followUpDays = ctx.followUpDays && ctx.followUpDays > 0 ? ctx.followUpDays : 14;
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
      ctaLabel: app.candidate_portal_url ? "Abrir portal" : "Preparar con IA",
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
      urgency: hours <= 24 ? 0 : hours <= 48 ? 1 : 4,
      tone: "violet",
      ctaLabel: "Preparar con IA",
    };
  }

  // Oferta recibida pendiente de decisión.
  if (app.stage === "offer" && (!app.offer_decision || app.offer_decision === "pending")) {
    const deadlineHours = (toDate(app.offer_deadline_at)?.getTime() ?? 0) - now;
    const urgent = app.offer_deadline_at && deadlineHours > 0 && deadlineHours <= 72 * 3_600_000;
    return {
      kind: "offer",
      label: "Tienes una oferta pendiente de decisión",
      detail: app.offer_deadline_at
        ? `Responde antes del ${fmtDate(app.offer_deadline_at)}`
        : "Decide si aceptarla, negociarla o rechazarla",
      urgency: urgent ? 1 : 4,
      tone: urgent ? "red" : "violet",
      ctaLabel: "Ver oferta",
    };
  }

  const days = daysSinceApplied(app);
  if (days !== null && days >= followUpDays && ["applied", "screening"].includes(app.stage)) {
    return {
      kind: "followup",
      label: `Haz seguimiento — ${days} días sin respuesta`,
      detail: "Un email breve al recruiter reactiva el proceso",
      urgency: days >= followUpDays + 7 ? 2 : 3,
      tone: "amber",
      ctaLabel: "Redactar seguimiento",
    };
  }

  // Proceso sin respuesta marcado como ghosted: sugiere cerrar o reactivar.
  if (app.stage === "ghosted") {
    return {
      kind: "ghosted",
      label: "Este proceso lleva tiempo sin novedades",
      detail: "Puedes intentar un último contacto o marcarlo como cerrado",
      urgency: 5,
      tone: "neutral",
      ctaLabel: "Redactar seguimiento",
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

  if (!app.description && !app.jd_responsibilities && !app.jd_skills?.length) {
    return {
      kind: "jd",
      label: "Guarda la descripción de la oferta",
      detail: "Te ayudará a prepararte mejor para cada etapa",
      urgency: 7,
      tone: "neutral",
      ctaLabel: "Añadir descripción",
    };
  }

  if (app.stage === "assessment" && !app.candidate_portal_url) {
    return {
      kind: "portal",
      label: "Guarda el portal del candidato",
      detail: "Así lo encuentras rápido cuando toque completar la prueba",
      urgency: 7,
      tone: "neutral",
      ctaLabel: "Añadir portal",
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
    .filter((app) => !app.archived && (!CLOSED_STAGES.includes(app.stage) || app.stage === "ghosted"))
    .map((app) => ({ app, action: nextBestAction(app, ctx) }))
    .filter((item): item is AttentionItem => !!item.action && item.action.urgency <= 6)
    .sort((a, b) => a.action.urgency - b.action.urgency)
    .slice(0, limit);
}

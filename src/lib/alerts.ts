import type {
  AppDocumentWithDoc,
  ApplicationRow,
  ApplicationWithCompany,
  CalendarRow,
  TimelineRow,
} from "@/lib/domain";
import { toDate } from "@/lib/format";

export type AlertTone = "warn" | "danger" | "info";
export type AppAlert = {
  id: string;
  kind:
    | "followup-early"
    | "followup"
    | "followup-late"
    | "assessment-due"
    | "interview-soon"
    | "offer-deadline"
    | "missing-cv"
    | "missing-jd"
    | "missing-portal"
    | "deadline-passed";
  label: string;
  detail: string;
  tone: AlertTone;
  /** 0 = más urgente. */
  urgency: number;
  ctaLabel: string;
  href?: string | null;
};

export const ALERT_TONE: Record<AlertTone, string> = {
  warn: "bg-warning/15 text-gold-foreground border-warning/35",
  danger: "bg-danger/10 text-danger border-danger/25",
  info: "bg-info/10 text-info border-info/25",
};

/** Días transcurridos desde el envío de la candidatura. */
export function daysSinceApplied(app: Pick<ApplicationRow, "applied_at">): number | null {
  const date = toDate(app.applied_at);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - date.getTime()) / 86_400_000));
}

function hoursUntil(date: string | null | undefined): number | null {
  const at = toDate(date)?.getTime();
  if (!at) return null;
  return (at - Date.now()) / 3_600_000;
}

const WAITING_STAGES = new Set(["applied", "screening"]);

export type AlertCtx = {
  events?: CalendarRow[];
  timeline?: TimelineRow[];
  links?: AppDocumentWithDoc[];
  /** Umbral de días sin respuesta configurado en el perfil (por defecto 14). */
  followUpDays?: number;
};

/**
 * Avisos contextuales y no invasivos de una candidatura, cada uno con su
 * propia acción sugerida. Se devuelven ordenados por urgencia (más urgente primero).
 */
export function applicationAlerts(app: ApplicationWithCompany, ctx: AlertCtx = {}): AppAlert[] {
  const alerts: AppAlert[] = [];
  const followUpDays = ctx.followUpDays && ctx.followUpDays > 0 ? ctx.followUpDays : 14;
  const events = (ctx.events ?? []).filter((event) => event.application_id === app.id);
  const timeline = (ctx.timeline ?? []).filter((row) => row.application_id === app.id);
  const links = (ctx.links ?? []).filter((link) => link.application_id === app.id);

  // Fecha límite ya pasada sin resolver.
  const overdue = timeline.find((row) => {
    const deadline = toDate(row.deadline_at)?.getTime();
    return !!deadline && deadline < Date.now() && row.status !== "done" && row.status !== "passed" && row.status !== "cancelled";
  });
  if (overdue) {
    alerts.push({
      id: "deadline-passed",
      kind: "deadline-passed",
      label: "Fecha límite pasada",
      detail: overdue.title || "Revisa qué pasó con esta fecha límite",
      tone: "danger",
      urgency: 0,
      ctaLabel: "Ver candidatura",
    });
  }

  // Prueba con fecha límite próxima (<48h).
  const assessmentSoon = [
    ...events
      .filter((event) => event.kind === "test" || event.kind === "deadline")
      .map((event) => hoursUntil(event.starts_at)),
    ...timeline
      .filter((row) => row.deadline_at)
      .map((row) => hoursUntil(row.deadline_at)),
  ].filter((h): h is number => h !== null && h > 0 && h <= 48);
  if (assessmentSoon.length > 0) {
    const hours = Math.min(...assessmentSoon);
    alerts.push({
      id: "assessment-due",
      kind: "assessment-due",
      label: "Prueba a punto de vencer",
      detail: hours <= 12 ? "Menos de 12 horas para completarla" : "Menos de 48 horas para completarla",
      tone: "danger",
      urgency: 1,
      ctaLabel: app.candidate_portal_url ? "Abrir portal" : "Ver candidatura",
      href: app.candidate_portal_url,
    });
  }

  // Entrevista en menos de 24h.
  const interviewHours = events
    .filter((event) => event.kind === "interview" || event.kind === "call")
    .map((event) => hoursUntil(event.starts_at))
    .filter((h): h is number => h !== null && h > 0 && h <= 24);
  if (interviewHours.length > 0) {
    alerts.push({
      id: "interview-soon",
      kind: "interview-soon",
      label: "Entrevista en menos de 24 horas",
      detail: "Prepárate con lo que sabes de la empresa y del rol",
      tone: "danger",
      urgency: 1,
      ctaLabel: "Preparar con IA",
    });
  }

  // Oferta que caduca pronto.
  const offerHours = hoursUntil(app.offer_deadline_at);
  if (app.stage === "offer" && offerHours !== null && offerHours > 0 && offerHours <= 72) {
    alerts.push({
      id: "offer-deadline",
      kind: "offer-deadline",
      label: "La oferta caduca pronto",
      detail: offerHours <= 24 ? "Menos de 24 horas para responder" : "Menos de 3 días para responder",
      tone: "danger",
      urgency: 2,
      ctaLabel: "Ver oferta",
    });
  }

  // Sin respuesta: tres niveles de urgencia según follow_up_days.
  const days = daysSinceApplied(app);
  if (WAITING_STAGES.has(app.stage) && days !== null) {
    if (days >= followUpDays + 7) {
      alerts.push({
        id: "followup-late",
        kind: "followup-late",
        label: "Sin respuesta desde hace tiempo",
        detail: `${days} días sin noticias — quizá conviene cerrar el proceso o insistir`,
        tone: "danger",
        urgency: 3,
        ctaLabel: "Redactar seguimiento",
      });
    } else if (days >= followUpDays) {
      alerts.push({
        id: "followup",
        kind: "followup",
        label: "Conviene hacer seguimiento",
        detail: `${days} días sin respuesta`,
        tone: "warn",
        urgency: 4,
        ctaLabel: "Redactar seguimiento",
      });
    } else if (days >= 7) {
      alerts.push({
        id: "followup-early",
        kind: "followup-early",
        label: "Podrías dar señales de vida",
        detail: `${days} días desde el envío, sin novedades`,
        tone: "info",
        urgency: 6,
        ctaLabel: "Redactar seguimiento",
      });
    }
  }

  // Datos que faltan y ayudan a la candidatura.
  if (app.stage !== "saved" && links.length === 0) {
    alerts.push({
      id: "missing-cv",
      kind: "missing-cv",
      label: "Falta el CV enviado",
      detail: "Vincúlalo para saber qué versión usaste",
      tone: "info",
      urgency: 7,
      ctaLabel: "Vincular CV",
    });
  }

  if (!app.description && !app.jd_responsibilities && !app.jd_skills?.length) {
    alerts.push({
      id: "missing-jd",
      kind: "missing-jd",
      label: "Falta guardar la descripción de la oferta",
      detail: "Te ayudará a preparar mejor cada etapa",
      tone: "info",
      urgency: 8,
      ctaLabel: "Añadir descripción",
    });
  }

  if (app.stage === "assessment" && !app.candidate_portal_url) {
    alerts.push({
      id: "missing-portal",
      kind: "missing-portal",
      label: "Falta el portal del candidato",
      detail: "Guarda el enlace para encontrarlo rápido cuando lo necesites",
      tone: "info",
      urgency: 8,
      ctaLabel: "Añadir portal",
    });
  }

  return alerts.sort((a, b) => a.urgency - b.urgency);
}

/** Los avisos más urgentes de toda la búsqueda, listos para Inicio (máx. 4). */
export function topAlerts(
  applications: ApplicationWithCompany[],
  ctx: AlertCtx = {},
  limit = 4,
): Array<{ app: ApplicationWithCompany; alert: AppAlert }> {
  const all = applications
    .filter((app) => !app.archived)
    .flatMap((app) => applicationAlerts(app, ctx).map((alert) => ({ app, alert })));
  return all.sort((a, b) => a.alert.urgency - b.alert.urgency).slice(0, limit);
}

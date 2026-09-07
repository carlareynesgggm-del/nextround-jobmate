import type { ApplicationRow, CalendarRow, TimelineRow } from "@/lib/domain";
import { toDate } from "@/lib/format";

export type AlertTone = "warn" | "danger" | "info";
export type AppAlert = { id: string; label: string; detail: string; tone: AlertTone };

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

const ACTIVE_STAGES = new Set(["applied", "screening"]);

/**
 * Avisos visuales de un proceso:
 * - +14 días sin respuesta → conviene hacer seguimiento
 * - prueba/deadline en menos de 48 h → vence pronto
 * - entrevista en menos de 24 h → toca preparar
 */
export function applicationAlerts(
  app: ApplicationRow,
  options: { events?: CalendarRow[]; timeline?: TimelineRow[] } = {},
): AppAlert[] {
  const alerts: AppAlert[] = [];
  const now = Date.now();
  const events = (options.events ?? []).filter((event) => event.application_id === app.id);
  const timeline = (options.timeline ?? []).filter((row) => row.application_id === app.id);

  const days = daysSinceApplied(app);
  const lastMovement = [...timeline]
    .map((row) => toDate(row.occurred_at)?.getTime() ?? 0)
    .sort((a, b) => b - a)[0];
  const daysSinceMovement = lastMovement
    ? Math.round((now - lastMovement) / 86_400_000)
    : days;

  if (
    ACTIVE_STAGES.has(app.stage) &&
    days !== null &&
    days >= 14 &&
    (daysSinceMovement ?? 0) >= 14
  ) {
    alerts.push({
      id: "followup",
      label: "Conviene hacer seguimiento",
      detail: `${days} días sin respuesta`,
      tone: "warn",
    });
  }

  const in48h = events.some((event) => {
    if (event.kind !== "test" && event.kind !== "deadline") return false;
    const start = toDate(event.starts_at)?.getTime();
    return !!start && start - now > 0 && start - now <= 48 * 3_600_000;
  });
  const deadlineSoon =
    in48h ||
    timeline.some((row) => {
      const deadline = toDate(row.deadline_at)?.getTime();
      return !!deadline && deadline - now > 0 && deadline - now <= 48 * 3_600_000;
    });
  if (deadlineSoon) {
    alerts.push({
      id: "due-soon",
      label: "Vence pronto",
      detail: "Prueba o fecha límite en menos de 48 h",
      tone: "danger",
    });
  }

  const interviewSoon = events.some((event) => {
    if (event.kind !== "interview" && event.kind !== "call") return false;
    const start = toDate(event.starts_at)?.getTime();
    return !!start && start - now > 0 && start - now <= 24 * 3_600_000;
  });
  if (interviewSoon) {
    alerts.push({
      id: "prepare",
      label: "Toca preparar",
      detail: "Entrevista en menos de 24 h",
      tone: "info",
    });
  }

  return alerts;
}

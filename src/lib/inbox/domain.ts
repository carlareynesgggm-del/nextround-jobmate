import type { Tables } from "@/integrations/supabase/types";

export type EmailConnectionRow = Tables<"email_connections">;
export type EmailEventRow = Tables<"email_events">;
export type EmailSuggestionRow = Tables<"email_suggestions">;
export type ActivityRow = Tables<"activity_feed">;
export type AlertRow = Tables<"alerts">;

export type EmailProvider = "gmail" | "outlook";

export const EMAIL_PROVIDER_LABEL: Record<EmailProvider, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
};

/** Tipos de correo de proceso de selección que NextRound sabe clasificar. */
export const EMAIL_TYPES = [
  "application_confirmation",
  "under_review",
  "recruiter_message",
  "next_stage",
  "assessment_invitation",
  "assessment_reminder",
  "video_interview",
  "interview_invitation",
  "interview_scheduling",
  "interview_confirmation",
  "interview_reschedule",
  "interview_cancellation",
  "case_study",
  "assessment_centre",
  "document_request",
  "portal_update",
  "offer",
  "offer_deadline",
  "rejection",
  "role_closed",
  "withdrawn",
  "general_update",
] as const;

export type EmailType = (typeof EMAIL_TYPES)[number];

export const EMAIL_TYPE_LABEL: Record<EmailType, string> = {
  application_confirmation: "Confirmación de candidatura",
  under_review: "Candidatura en revisión",
  recruiter_message: "Mensaje del recruiter",
  next_stage: "Invitación a la siguiente fase",
  assessment_invitation: "Invitación a prueba",
  assessment_reminder: "Recordatorio de prueba",
  video_interview: "Entrevista en vídeo",
  interview_invitation: "Invitación a entrevista",
  interview_scheduling: "Petición para agendar entrevista",
  interview_confirmation: "Entrevista confirmada",
  interview_reschedule: "Cambio de fecha de entrevista",
  interview_cancellation: "Entrevista cancelada",
  case_study: "Caso práctico",
  assessment_centre: "Assessment centre",
  document_request: "Petición de documentos",
  portal_update: "Novedad en el portal",
  offer: "Oferta",
  offer_deadline: "Fecha límite de la oferta",
  rejection: "Descartada",
  role_closed: "Puesto cerrado",
  withdrawn: "Candidatura retirada",
  general_update: "Actualización general",
};

export const ALERT_CATEGORIES = [
  "action_required",
  "interview",
  "assessment",
  "offer",
  "positive",
  "info",
  "negative",
  "followup",
  "deadline",
  "document_request",
  "portal_update",
] as const;

export type AlertCategory = (typeof ALERT_CATEGORIES)[number];

export const ALERT_CATEGORY_LABEL: Record<AlertCategory, string> = {
  action_required: "Acción requerida",
  interview: "Entrevista",
  assessment: "Prueba",
  offer: "Oferta",
  positive: "Buena noticia",
  info: "Información",
  negative: "Mala noticia",
  followup: "Seguimiento",
  deadline: "Fecha límite",
  document_request: "Documentos",
  portal_update: "Portal",
};

export type AlertPriority = "urgent" | "high" | "normal" | "low";

export const ALERT_PRIORITY_LABEL: Record<AlertPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  normal: "Normal",
  low: "Baja",
};

export function alertPriorityTone(priority: string): string {
  switch (priority) {
    case "urgent":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "high":
      return "border-violet/30 bg-violet/10 text-violet";
    case "low":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "border-border bg-surface text-foreground";
  }
}

/** Cambios que NextRound puede proponer a partir de un correo. */
export const SUGGESTION_KINDS = [
  "activity",
  "stage",
  "assessment",
  "interview",
  "deadline",
  "task",
  "calendar",
  "link",
  "contact",
  "offer",
  "new_application",
] as const;

export type SuggestionKind = (typeof SUGGESTION_KINDS)[number];

export const SUGGESTION_KIND_LABEL: Record<SuggestionKind, string> = {
  activity: "Guardar el correo en el historial",
  stage: "Actualizar la fase",
  assessment: "Crear la prueba",
  interview: "Crear la entrevista",
  deadline: "Añadir fecha límite",
  task: "Crear tarea",
  calendar: "Añadir al calendario",
  link: "Guardar el enlace",
  contact: "Guardar el contacto",
  offer: "Guardar los datos de la oferta",
  new_application: "Crear la candidatura",
};

export type EmailEventStatus = "pending" | "applied" | "ignored" | "needs_match";

/** Datos que el asistente intenta extraer de un correo. Nunca se inventan. */
export type ExtractedEmail = {
  company?: string | null;
  role?: string | null;
  application_ref?: string | null;
  stage?: string | null;
  deadline_at?: string | null;
  starts_at?: string | null;
  timezone?: string | null;
  duration_min?: number | null;
  recruiter_name?: string | null;
  recruiter_email?: string | null;
  meeting_url?: string | null;
  assessment_url?: string | null;
  portal_url?: string | null;
  required_action?: string | null;
  documents_requested?: string | null;
  offer_salary?: string | null;
  notes?: string | null;
};

export function extractedOf(event: EmailEventRow): ExtractedEmail {
  return (event.extracted ?? {}) as ExtractedEmail;
}

export function confidenceLabel(confidence: number | null): "alta" | "media" | "baja" {
  const value = confidence ?? 0;
  if (value >= 0.8) return "alta";
  if (value >= 0.5) return "media";
  return "baja";
}

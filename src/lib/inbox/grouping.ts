import { extractedOf, type EmailEventRow, type EmailSuggestionRow } from "@/lib/inbox/domain";
import { companyFromEmail, normalizeCompany } from "@/lib/inbox/match";

/** Normaliza un puesto para poder agrupar correos del mismo proceso. */
export function normalizeRole(raw: string | null | undefined): string {
  return (raw ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9áéíóúñü ]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clave estable de un proceso de selección.
 * Si el correo ya está vinculado a una candidatura, esa candidatura es el proceso.
 */
export function processKeyOf(input: {
  applicationId?: string | null;
  company?: string | null;
  role?: string | null;
  fromEmail?: string | null;
  threadId?: string | null;
  fallback: string;
}): string {
  if (input.applicationId) return `app:${input.applicationId}`;
  const company = normalizeCompany(input.company) || normalizeCompany(companyFromEmail(input.fromEmail));
  if (company) return `co:${company}|${normalizeRole(input.role)}`;
  if (input.threadId) return `thread:${input.threadId}`;
  return `msg:${input.fallback}`;
}

export type DetectedProcess = {
  key: string;
  company: string | null;
  role: string | null;
  applicationId: string | null;
  /** No existe todavía como candidatura: hay una propuesta de creación. */
  isNew: boolean;
  events: EmailEventRow[];
  /** Propuestas pendientes de todos los correos del proceso. */
  suggestions: EmailSuggestionRow[];
  lastReceivedAt: string | null;
};

/** Agrupa los correos detectados en procesos de selección. */
export function groupProcesses(
  events: EmailEventRow[],
  suggestions: EmailSuggestionRow[],
): DetectedProcess[] {
  const byEvent = new Map<string, EmailSuggestionRow[]>();
  for (const suggestion of suggestions) {
    if (suggestion.status !== "pending") continue;
    const list = byEvent.get(suggestion.email_event_id) ?? [];
    list.push(suggestion);
    byEvent.set(suggestion.email_event_id, list);
  }

  const groups = new Map<string, DetectedProcess>();

  for (const event of events) {
    const extracted = extractedOf(event);
    const stored = typeof extracted.process_key === "string" ? extracted.process_key : null;
    const key =
      event.application_id
        ? `app:${event.application_id}`
        : (stored ??
          processKeyOf({
            company: extracted.company ?? null,
            role: extracted.role ?? null,
            fromEmail: event.from_email,
            threadId: event.thread_id,
            fallback: event.id,
          }));

    const eventSuggestions = byEvent.get(event.id) ?? [];
    const current = groups.get(key);
    if (current) {
      current.events.push(event);
      current.suggestions.push(...eventSuggestions);
      current.company ??= extracted.company ?? null;
      current.role ??= extracted.role ?? null;
      current.applicationId ??= event.application_id;
      if (!current.lastReceivedAt || (event.received_at ?? "") > current.lastReceivedAt) {
        current.lastReceivedAt = event.received_at ?? current.lastReceivedAt;
      }
      continue;
    }

    groups.set(key, {
      key,
      company: extracted.company ?? companyFromEmail(event.from_email) ?? null,
      role: extracted.role ?? null,
      applicationId: event.application_id,
      isNew: false,
      events: [event],
      suggestions: [...eventSuggestions],
      lastReceivedAt: event.received_at ?? null,
    });
  }

  const list = [...groups.values()];
  for (const group of list) {
    group.isNew = !group.applicationId && group.suggestions.some((s) => s.kind === "new_application");
  }
  return list.sort((a, b) => (b.lastReceivedAt ?? "").localeCompare(a.lastReceivedAt ?? ""));
}

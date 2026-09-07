import type { Database } from "@/integrations/supabase/types";

export type Stage = Database["public"]["Enums"]["app_stage"];
export type WorkMode = Database["public"]["Enums"]["work_mode"];
export type DocKind = Database["public"]["Enums"]["doc_kind"];
export type EventKind = Database["public"]["Enums"]["event_kind"];

export type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type CalendarRow = Database["public"]["Tables"]["calendar_events"]["Row"];
export type TimelineRow = Database["public"]["Tables"]["application_events"]["Row"];
export type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
export type AppDocumentRow = Database["public"]["Tables"]["application_documents"]["Row"];

export type AppDocumentWithDoc = AppDocumentRow & { documents: DocumentRow | null };

export type ApplicationWithCompany = ApplicationRow & {
  companies: Pick<CompanyRow, "id" | "name" | "industry" | "location" | "website"> | null;
};

export const EMPLOYMENT_TYPES = [
  "Jornada completa",
  "Media jornada",
  "Contrato temporal",
  "Freelance",
  "Prácticas",
] as const;

export const APPLICATION_TYPES = [
  "Portal de empleo",
  "Web de la empresa",
  "Referido",
  "Recruiter",
  "Email directo",
  "LinkedIn",
] as const;

export const PROCESS_STATUS_LABEL: Record<string, string> = {
  scheduled: "Programada",
  pending: "Pendiente",
  done: "Completada",
  passed: "Superada",
  failed: "No superada",
  cancelled: "Cancelada",
};

export function processStatusTone(status: string): string {
  if (status === "passed" || status === "done") return "bg-success/15 text-success border-success/30";
  if (status === "failed" || status === "cancelled") return "bg-danger/10 text-danger border-danger/25";
  if (status === "scheduled") return "bg-info/10 text-info border-info/25";
  return "bg-warning/15 text-gold-foreground border-warning/30";
}


export const STAGES: Stage[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "technical",
  "final",
  "offer",
  "rejected",
  "withdrawn",
];

/** Stages that represent a live process. */
export const PIPELINE_STAGES: Stage[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "technical",
  "final",
  "offer",
];

export const CLOSED_STAGES: Stage[] = ["rejected", "withdrawn"];

type StageMeta = { label: string; short: string; tone: string; dot: string };

export const STAGE_META: Record<Stage, StageMeta> = {
  saved: {
    label: "Guardada",
    short: "Guardada",
    tone: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  applied: {
    label: "Enviada",
    short: "Enviada",
    tone: "bg-info/10 text-info border-info/25",
    dot: "bg-info",
  },
  screening: {
    label: "Screening",
    short: "Screening",
    tone: "bg-violet/10 text-violet border-violet/25",
    dot: "bg-violet",
  },
  interview: {
    label: "Entrevista",
    short: "Entrevista",
    tone: "bg-gold/15 text-gold-foreground border-gold/35",
    dot: "bg-gold",
  },
  technical: {
    label: "Prueba técnica",
    short: "Técnica",
    tone: "bg-warning/15 text-gold-foreground border-warning/35",
    dot: "bg-warning",
  },
  final: {
    label: "Ronda final",
    short: "Final",
    tone: "bg-primary/10 text-primary border-primary/25",
    dot: "bg-primary",
  },
  offer: {
    label: "Oferta",
    short: "Oferta",
    tone: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
  },
  rejected: {
    label: "Rechazada",
    short: "Rechazada",
    tone: "bg-danger/10 text-danger border-danger/25",
    dot: "bg-danger",
  },
  withdrawn: {
    label: "Retirada",
    short: "Retirada",
    tone: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  onsite: "Presencial",
  hybrid: "Híbrido",
  remote: "Remoto",
};

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  cv: "CV",
  cover_letter: "Carta",
  portfolio: "Portfolio",
  certificate: "Certificado",
  other: "Otro",
};

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  interview: "Entrevista",
  call: "Llamada",
  test: "Prueba",
  deadline: "Fecha límite",
  followup: "Seguimiento",
  other: "Otro",
};

export const EVENT_KIND_TONE: Record<EventKind, string> = {
  interview: "bg-gold/15 text-gold-foreground border-gold/35",
  call: "bg-info/10 text-info border-info/25",
  test: "bg-violet/10 text-violet border-violet/25",
  deadline: "bg-danger/10 text-danger border-danger/25",
  followup: "bg-success/12 text-success border-success/25",
  other: "bg-muted text-muted-foreground border-border",
};

export const PRIORITY_LABEL: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function priorityTone(priority: string): string {
  if (priority === "high") return "bg-danger/10 text-danger border-danger/25";
  if (priority === "low") return "bg-muted text-muted-foreground border-border";
  return "bg-warning/15 text-gold-foreground border-warning/30";
}

export function isActive(stage: Stage): boolean {
  return !CLOSED_STAGES.includes(stage);
}

export function formatSalary(min: number | null, max: number | null, currency = "EUR"): string {
  const symbol = currency === "EUR" ? "€" : currency;
  const fmt = (n: number) => `${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)}–${fmt(max)} ${symbol}`;
  if (min) return `desde ${fmt(min)} ${symbol}`;
  if (max) return `hasta ${fmt(max)} ${symbol}`;
  return "Sin datos";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Deterministic accent per company name so avatars stay stable. */
export function companyTint(name: string): string {
  const tints = [
    "bg-primary/10 text-primary",
    "bg-gold/20 text-gold-foreground",
    "bg-success/15 text-success",
    "bg-info/12 text-info",
    "bg-violet/12 text-violet",
  ];
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return tints[sum % tints.length] as string;
}

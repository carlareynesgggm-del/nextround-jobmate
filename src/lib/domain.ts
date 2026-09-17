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
  if (status === "passed" || status === "done") return "border-success/25 bg-success/10 text-success";
  if (status === "failed" || status === "cancelled") return "border-danger/25 bg-danger/8 text-danger";
  if (status === "scheduled") return "border-info/25 bg-info/8 text-info";
  return "border-border/70 bg-surface-2 text-muted-foreground";
}


export const STAGES: Stage[] = [
  "saved",
  "applied",
  "screening",
  "assessment",
  "interview",
  "technical",
  "final",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "ghosted",
];

/** Stages that represent a live process. */
export const PIPELINE_STAGES: Stage[] = [
  "saved",
  "applied",
  "screening",
  "assessment",
  "interview",
  "technical",
  "final",
  "offer",
];

/** Columns shown on the kanban board. */
export const KANBAN_STAGES: Stage[] = [
  "saved",
  "applied",
  "screening",
  "assessment",
  "interview",
  "final",
  "offer",
];

export const CLOSED_STAGES: Stage[] = ["rejected", "withdrawn", "ghosted"];

/** Quick filters on the applications page. */
export const QUICK_FILTERS = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Activas" },
  { id: "waiting", label: "Esperando" },
  { id: "interview", label: "Entrevista" },
  { id: "offer", label: "Oferta" },
  { id: "closed", label: "Cerradas" },
] as const;

export type QuickFilter = (typeof QUICK_FILTERS)[number]["id"];

export function matchesQuickFilter(stage: Stage, filter: QuickFilter): boolean {
  switch (filter) {
    case "active":
      return isActive(stage) && stage !== "saved";
    case "waiting":
      return stage === "applied" || stage === "screening";
    case "interview":
      return stage === "interview" || stage === "technical" || stage === "final" || stage === "assessment";
    case "offer":
      return stage === "offer" || stage === "accepted";
    case "closed":
      return CLOSED_STAGES.includes(stage);
    default:
      return true;
  }
}

/** Types of opportunity a student can apply to. */
export const APPLICATION_TYPE_OPTIONS = [
  "Prácticas",
  "Prácticas de verano",
  "Prácticas fuera de ciclo",
  "Spring Week",
  "Programa de graduados",
  "Jornada completa",
  "Media jornada",
  "Año de prácticas",
  "Formación dual",
  "Estudiante en prácticas",
  "Freelance",
  "Otro",
] as const;

/** Where the application was submitted from. */
export const SOURCE_OPTIONS = [
  "LinkedIn",
  "Web de la empresa",
  "Referido",
  "Portal universitario",
  "Recruiter",
  "Portal de empleo",
  "Email directo",
  "Otro",
] as const;

export const SALARY_PERIODS = ["Anual", "Mensual", "Semanal", "Diario", "Por hora"] as const;

/** Stage types available inside the process timeline. */
export const STAGE_TYPES = [
  "Candidatura",
  "Screening",
  "Prueba online",
  "Test numérico",
  "Test lógico",
  "Test psicométrico",
  "HireVue",
  "Prueba de código",
  "Caso práctico",
  "Entrevista RRHH",
  "Llamada con recruiter",
  "Entrevista técnica",
  "Entrevista con hiring manager",
  "Entrevista de panel",
  "Assessment centre",
  "Entrevista final",
  "Referencias",
  "Verificación de antecedentes",
  "Oferta",
  "Otro",
] as const;

export const INTERVIEW_STAGE_TYPES: string[] = [
  "Entrevista RRHH",
  "Llamada con recruiter",
  "Entrevista técnica",
  "Entrevista con hiring manager",
  "Entrevista de panel",
  "Entrevista final",
  "Assessment centre",
];

export const ASSESSMENT_STAGE_TYPES: string[] = [
  "Prueba online",
  "Test numérico",
  "Test lógico",
  "Test psicométrico",
  "HireVue",
  "Prueba de código",
  "Caso práctico",
];

export const ASSESSMENT_PROVIDERS = [
  "HireVue",
  "SHL",
  "Pymetrics",
  "Arctic Shores",
  "Codility",
  "HackerRank",
  "Test numérico",
  "Test lógico",
  "Test psicométrico",
  "Prueba de Excel",
  "Caso práctico",
  "Prueba técnica",
  "Otro",
] as const;

export const CONTACT_TYPES = [
  "Recruiter",
  "Talent Acquisition",
  "Hiring manager",
  "Entrevistador",
  "Empleado",
  "Referido",
  "RRHH",
  "Otro",
] as const;

export const OFFER_DECISIONS = [
  { id: "pending", label: "Aún decidiendo" },
  { id: "accepted", label: "Aceptada" },
  { id: "declined", label: "Rechazada" },
] as const;

/** Fallback text for unknown data. */
export const UNKNOWN = "Sin especificar";

type StageMeta = { label: string; short: string; tone: string; dot: string };

export const STAGE_META: Record<Stage, StageMeta> = {
  saved: {
    label: "Guardada",
    short: "Guardada",
    tone: "border-border/70 bg-surface-2 text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  applied: {
    label: "Enviada",
    short: "Enviada",
    tone: "border-border/70 bg-surface-2 text-foreground/80",
    dot: "bg-info",
  },
  screening: {
    label: "Screening",
    short: "Screening",
    tone: "border-border/70 bg-surface-2 text-foreground/80",
    dot: "bg-violet",
  },
  assessment: {
    label: "Prueba",
    short: "Prueba",
    tone: "border-border/70 bg-surface-2 text-foreground/80",
    dot: "bg-gold",
  },
  interview: {
    label: "Entrevista",
    short: "Entrevista",
    tone: "border-border/70 bg-surface-2 text-foreground/80",
    dot: "bg-violet",
  },
  technical: {
    label: "Prueba técnica",
    short: "Técnica",
    tone: "border-border/70 bg-surface-2 text-foreground/80",
    dot: "bg-gold",
  },
  final: {
    label: "Ronda final",
    short: "Final",
    tone: "border-border/70 bg-surface-2 text-foreground/80",
    dot: "bg-primary",
  },
  offer: {
    label: "Oferta",
    short: "Oferta",
    tone: "border-success/25 bg-success/10 text-success",
    dot: "bg-success",
  },
  rejected: {
    label: "Rechazada",
    short: "Rechazada",
    tone: "border-danger/25 bg-danger/8 text-danger",
    dot: "bg-danger",
  },
  withdrawn: {
    label: "Retirada",
    short: "Retirada",
    tone: "border-border/70 bg-surface-2 text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  accepted: {
    label: "Aceptada",
    short: "Aceptada",
    tone: "border-success/30 bg-success/12 text-success",
    dot: "bg-success",
  },
  ghosted: {
    label: "Sin respuesta",
    short: "Sin resp.",
    tone: "border-border/70 bg-surface-2 text-muted-foreground",
    dot: "bg-muted-foreground/40",
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
  interview: "border-violet/25 bg-violet/8 text-violet",
  call: "border-info/25 bg-info/8 text-info",
  test: "border-gold/30 bg-gold/10 text-gold-foreground",
  deadline: "border-danger/25 bg-danger/8 text-danger",
  followup: "border-border/70 bg-surface-2 text-muted-foreground",
  other: "border-border/70 bg-surface-2 text-muted-foreground",
};

export const PRIORITY_LABEL: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function priorityTone(priority: string): string {
  if (priority === "high") return "border-danger/25 bg-danger/8 text-danger";
  if (priority === "low") return "border-border/70 bg-surface-2 text-muted-foreground";
  return "border-border/70 bg-surface-2 text-foreground/70";
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
    "bg-violet/8 text-violet",
    "bg-info/8 text-info",
    "bg-surface-2 text-foreground/70",
  ];
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return tints[sum % tints.length] as string;
}

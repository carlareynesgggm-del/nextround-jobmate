import type { GmailMessage } from "@/lib/inbox/gmail.server";
import type { EmailType, ExtractedEmail, SuggestionKind } from "@/lib/inbox/domain";
import { companyFromEmail, findApplicationMatch, type MatchTarget } from "@/lib/inbox/match";


export type Classification = {
  emailType: EmailType;
  confidence: number;
  extracted: ExtractedEmail;
  suggestions: {
    kind: SuggestionKind;
    label: string;
    detail?: string | null;
    payload: Record<string, unknown>;
  }[];
};

type Rule = { type: EmailType; weight: number; words: string[] };

/** Reglas de detección: sólo correos de proceso de selección. */
const RULES: Rule[] = [
  {
    type: "rejection",
    weight: 0.86,
    words: [
      "we regret",
      "unfortunately",
      "not moving forward",
      "not been selected",
      "no continuaremos",
      "no ha sido seleccionad",
      "hemos decidido no",
      "lamentamos",
      "unsuccessful",
    ],
  },
  {
    type: "offer",
    weight: 0.84,
    words: ["job offer", "offer of employment", "oferta de empleo", "te ofrecemos", "offer letter"],
  },
  {
    type: "interview_invitation",
    weight: 0.82,
    words: [
      "invite you to an interview",
      "interview invitation",
      "schedule an interview",
      "invitación a entrevista",
      "te invitamos a una entrevista",
      "agendar entrevista",
      "book a time",
      "invitation à un entretien",
    ],
  },
  {
    type: "assessment_invitation",
    weight: 0.82,
    words: [
      "online assessment",
      "complete the assessment",
      "assessment invitation",
      "test online",
      "prueba online",
      "hackerrank",
      "codility",
      "sjt",
      "numerical reasoning",
      "video interview",
      "hirevue",
    ],
  },
  {
    type: "document_request",
    weight: 0.75,
    words: [
      "please send your",
      "we need the following documents",
      "upload your",
      "envíanos tu",
      "necesitamos tu",
      "transcript",
      "certificate",
      "proof of",
    ],
  },
  {
    type: "next_stage",
    weight: 0.76,
    words: ["next stage", "next step in the process", "siguiente fase", "pasas a la siguiente"],
  },
  {
    type: "application_confirmation",
    weight: 0.78,
    words: [
      "thank you for applying",
      "we have received your application",
      "application received",
      "hemos recibido tu candidatura",
      "gracias por postularte",
      "gracias por tu candidatura",
      "your application to",
      "candidature reçue",
      "bewerbung erhalten",
    ],
  },
  {
    type: "portal_update",
    weight: 0.6,
    words: ["candidate portal", "your application status", "portal del candidato", "workday", "greenhouse", "successfactors"],
  },
  {
    type: "under_review",
    weight: 0.55,
    words: ["under review", "in review", "en revisión", "reviewing your application"],
  },
  {
    type: "recruiter_message",
    weight: 0.5,
    words: ["talent acquisition", "recruiter", "recruiting team", "reclutamiento", "hiring team"],
  },
];

const STAGE_BY_TYPE: Partial<Record<EmailType, string>> = {
  application_confirmation: "applied",
  under_review: "screening",
  assessment_invitation: "assessment",
  interview_invitation: "interview",
  next_stage: "interview",
  offer: "offer",
  rejection: "rejected",
};

function firstUrl(text: string): string | null {
  const match = /https?:\/\/[^\s"'<>)]+/.exec(text);
  return match ? match[0] : null;
}

/** Fecha explícita en formato ISO o dd/mm/yyyy; si no hay, no se inventa nada. */
function findDate(text: string): string | null {
  const iso = /\b(20\d{2})-(\d{2})-(\d{2})\b/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}T09:00:00.000Z`;
  const dmy = /\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b/.exec(text);
  if (dmy) {
    const d = String(dmy[1]).padStart(2, "0");
    const m = String(dmy[2]).padStart(2, "0");
    return `${dmy[3]}-${m}-${d}T09:00:00.000Z`;
  }
  return null;
}

export function companyGuess(message: GmailMessage): string | null {
  const fromDomain = companyFromEmail(message.fromEmail);
  if (fromDomain) return fromDomain.charAt(0).toUpperCase() + fromDomain.slice(1);
  const named = /\bat\s+([A-Z][\w&.-]+(?:\s[A-Z][\w&.-]+)?)/.exec(message.subject);
  return named?.[1] ?? (message.fromName || null);
}

/** Puesto mencionado en el asunto, cuando el formato lo deja claro. */
function roleGuess(subject: string): string | null {
  const patterns = [
    /(?:for the|para el puesto de|para la posición de|application (?:for|to)|candidatura (?:a|para))\s+([^–—|,.:]{4,80})/i,
    /[–—-]\s*([A-Z][^–—|]{6,80}(?:Intern|Internship|Analyst|Engineer|Manager|Graduate|Trainee|Programme|Program)[^–—|]{0,30})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(subject);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return null;
}

/** Devuelve null cuando el correo no parece del proceso de selección. */
export function classify(message: GmailMessage): Classification | null {
  const haystack = `${message.subject}\n${message.snippet}`.toLowerCase();
  let best: Rule | null = null;
  for (const rule of RULES) {
    if (rule.words.some((word) => haystack.includes(word))) {
      if (!best || rule.weight > best.weight) best = rule;
    }
  }
  if (!best) return null;

  const url = firstUrl(`${message.subject} ${message.snippet}`);
  const date = findDate(`${message.subject} ${message.snippet}`);
  const company = companyGuess(message);
  const role = roleGuess(message.subject);

  const extracted: ExtractedEmail = {
    company,
    ...(role ? { role } : {}),
    recruiter_name: message.fromName || null,
    recruiter_email: message.fromEmail || null,
    ...(url ? { portal_url: url } : {}),
    ...(date ? { deadline_at: date } : {}),
    ...(STAGE_BY_TYPE[best.type] ? { stage: STAGE_BY_TYPE[best.type] ?? null } : {}),
    notes: message.snippet || null,
  };


  const suggestions: Classification["suggestions"] = [
    {
      kind: "activity",
      label: "Guardar este correo en el historial de la candidatura",
      detail: message.subject || null,
      payload: {},
    },
  ];

  const stage = STAGE_BY_TYPE[best.type];
  if (stage) {
    suggestions.push({
      kind: "stage",
      label:
        stage === "rejected"
          ? "Marcar esta candidatura como Rechazada"
          : `Actualizar la fase a “${stage}”`,
      detail:
        stage === "rejected"
          ? "Este correo parece un rechazo. Sólo se aplica si lo confirmas."
          : "Sólo se aplica si lo marcas.",
      payload: { stage },
    });
  }

  if (best.type === "assessment_invitation" || best.type === "interview_invitation") {
    suggestions.push({
      kind: best.type === "assessment_invitation" ? "assessment" : "interview",
      label:
        best.type === "assessment_invitation"
          ? "Crear la prueba en el proceso"
          : "Crear la entrevista en el proceso",
      detail: message.subject || null,
      payload: {
        title: message.subject || null,
        ...(date ? { deadline_at: date } : {}),
        ...(url ? (best.type === "assessment_invitation" ? { assessment_url: url } : { meeting_url: url }) : {}),
        instructions: message.snippet || null,
      },
    });
  }

  if (date && (best.type === "assessment_invitation" || best.type === "offer" || best.type === "document_request")) {
    suggestions.push({
      kind: "deadline",
      label: "Añadir la fecha límite a la candidatura",
      detail: date.slice(0, 10),
      payload: { deadline_at: date },
    });
  }

  if (best.type === "document_request") {
    suggestions.push({
      kind: "task",
      label: "Crear tarea: enviar los documentos pedidos",
      detail: message.snippet || null,
      payload: { title: "Enviar documentos solicitados", priority: "high" },
    });
  }

  if (url && (best.type === "portal_update" || best.type === "application_confirmation")) {
    suggestions.push({
      kind: "link",
      label: "Guardar el enlace del portal del candidato",
      detail: url,
      payload: { candidate_portal_url: url },
    });
  }

  if (message.fromEmail && best.type === "recruiter_message") {
    suggestions.push({
      kind: "contact",
      label: `Guardar el contacto ${message.fromName || message.fromEmail}`,
      detail: message.fromEmail,
      payload: { name: message.fromName || message.fromEmail, email: message.fromEmail, contact_type: "recruiter" },
    });
  }

  // Fechas importantes: se ofrecen para el calendario, nunca se añaden solas.
  if (date && (best.type === "interview_invitation" || best.type === "next_stage" || best.type === "assessment_invitation")) {
    suggestions.push({
      kind: "calendar",
      label: "Añadir esta fecha al calendario",
      detail: date.slice(0, 10),
      payload: {
        title: message.subject || null,
        starts_at: date,
        kind: best.type === "assessment_invitation" ? "test" : "interview",
        ...(url ? { location: url } : {}),
      },
    });
  }

  return { emailType: best.type, confidence: best.weight, extracted, suggestions };
}

/** Empareja el correo con una candidatura existente sin adivinar de más. */
export function matchApplication(
  message: GmailMessage,
  classification: Classification,
  apps: MatchTarget[],
): { id: string | null; confident: boolean; candidates: string[] } {
  const result = findApplicationMatch(
    {
      subject: message.subject,
      snippet: message.snippet,
      fromEmail: message.fromEmail,
      fromName: message.fromName,
      company: classification.extracted.company ?? null,
      role: classification.extracted.role ?? null,
      url: classification.extracted.portal_url ?? null,
    },
    apps,
  );
  return { id: result.id, confident: result.id !== null, candidates: result.candidates };
}


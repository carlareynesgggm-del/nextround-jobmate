/**
 * Emparejamiento de correos con candidaturas existentes.
 * Puro y compartido entre servidor y cliente: nunca escribe nada.
 */

export type MatchTarget = {
  id: string;
  role_title: string;
  company: string | null;
  job_url?: string | null;
  candidate_portal_url?: string | null;
};

export type MatchResult = {
  id: string | null;
  /** 0..1 — a partir de 0.7 se considera fiable. */
  confidence: number;
  /** Candidatas plausibles cuando no hay certeza, mejor primero. */
  candidates: string[];
};

const LEGAL_WORDS = [
  "inc",
  "llc",
  "ltd",
  "limited",
  "gmbh",
  "sa",
  "sas",
  "sl",
  "srl",
  "bv",
  "plc",
  "corp",
  "corporation",
  "company",
  "group",
  "holdings",
  "espana",
  "spain",
  "europe",
  "emea",
  "global",
  "international",
];

/** Prefijos/sufijos de buzones y marcas de empleo que no son la empresa. */
const NOISE_WORDS = [
  "careers",
  "career",
  "jobs",
  "job",
  "talent",
  "talentacquisition",
  "recruiting",
  "recruitment",
  "hiring",
  "hr",
  "people",
  "noreply",
  "no",
  "reply",
  "donotreply",
  "mail",
  "email",
  "notifications",
  "notification",
  "life",
  "lifeat",
  "at",
  "join",
  "work",
  "workat",
  "team",
  "apply",
  "applications",
  "candidate",
  "candidates",
  "students",
  "graduates",
  "university",
  "campus",
];

export const GENERIC_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "protonmail.com",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "myworkday.com",
  "workday.com",
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "smartrecruiters.com",
  "successfactors.com",
  "icims.com",
  "taleo.net",
  "eu.dcbmail.com",
]);

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Reduce un nombre de empresa a su forma canónica.
 * "LifeAtTikTok", "TikTok Inc.", "careers.tiktok.com" → "tiktok".
 */
export function normalizeCompany(raw: string | null | undefined): string {
  if (!raw) return "";
  let value = stripAccents(String(raw)).toLowerCase();
  value = value.replace(/https?:\/\//g, " ").replace(/\.(com|es|org|net|io|co|eu|de|fr|uk|us)\b/g, " ");
  // Separa camelCase antes de limpiar: lifeAtTikTok → life at tik tok
  value = stripAccents(String(raw)).replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  value = value.replace(/https?:\/\/[^\s]*/g, " ");
  const parts = value
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((word) => !LEGAL_WORDS.includes(word))
    .filter((word) => !NOISE_WORDS.includes(word))
    .filter((word) => !/^(com|es|org|net|io|co|eu|de|fr|uk|us|www)$/.test(word));
  return parts.join("");
}

/** Empresa deducida del dominio del remitente, si no es un dominio genérico. */
export function companyFromEmail(email: string | null | undefined): string | null {
  const domain = (email ?? "").split("@")[1]?.toLowerCase() ?? "";
  if (!domain || GENERIC_DOMAINS.has(domain)) return null;
  const labels = domain.split(".").filter((label) => label !== "www");
  const base = labels.length > 2 ? labels[labels.length - 2] : labels[0];
  if (!base || base.length < 3 || NOISE_WORDS.includes(base)) {
    const fallback = labels[labels.length - 2];
    if (!fallback || fallback.length < 3) return null;
    return fallback;
  }
  return base;
}

function hostOf(url: string | null | undefined): string {
  const match = /https?:\/\/([^/\s]+)/.exec(url ?? "");
  return (match?.[1] ?? "").toLowerCase().replace(/^www\./, "");
}

function roleTokens(role: string): string[] {
  return stripAccents(role.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);
}

function roleOverlap(role: string, haystack: string): number {
  const tokens = roleTokens(role);
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return hits / tokens.length;
}

export type MatchInput = {
  subject?: string | null;
  snippet?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
  company?: string | null;
  role?: string | null;
  url?: string | null;
};

/**
 * Busca la candidatura a la que pertenece un correo (o una posible alta duplicada).
 * Nunca decide sola: devuelve confianza y alternativas para que la persona confirme.
 */
export function findApplicationMatch(input: MatchInput, apps: MatchTarget[]): MatchResult {
  const haystack = stripAccents(
    `${input.subject ?? ""} ${input.snippet ?? ""} ${input.fromName ?? ""} ${input.fromEmail ?? ""}`,
  ).toLowerCase();

  const emailCompany = companyFromEmail(input.fromEmail);
  const signals = [input.company, emailCompany, input.fromName, input.fromEmail]
    .map((value) => normalizeCompany(value))
    .filter((value) => value.length > 2);

  const urlHost = hostOf(input.url);

  const scored = apps
    .map((app) => {
      const appCompany = normalizeCompany(app.company);
      let score = 0;

      if (appCompany.length > 2) {
        if (signals.some((signal) => signal === appCompany)) score += 0.6;
        else if (signals.some((signal) => signal.includes(appCompany) || appCompany.includes(signal)))
          score += 0.45;
        else if (haystack.replace(/[^a-z0-9]/g, "").includes(appCompany)) score += 0.35;
      }

      const appHosts = [hostOf(app.job_url), hostOf(app.candidate_portal_url)].filter(Boolean);
      if (urlHost && appHosts.includes(urlHost)) score += 0.35;
      else if (appHosts.some((host) => haystack.includes(host))) score += 0.2;

      const overlap = roleOverlap(app.role_title, haystack);
      if (overlap >= 0.6) score += 0.35;
      else if (overlap >= 0.3) score += 0.15;

      if (input.role) {
        const roleMatch = roleOverlap(app.role_title, stripAccents(input.role.toLowerCase()));
        if (roleMatch >= 0.6) score += 0.15;
      }

      return { id: app.id, score: Math.min(score, 1) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { id: null, confidence: 0, candidates: [] };

  const best = scored[0]!;
  const runnerUp = scored[1]?.score ?? 0;
  const clear = best.score >= 0.7 && best.score - runnerUp >= 0.15;

  return {
    id: clear ? best.id : null,
    confidence: best.score,
    candidates: scored.slice(0, 4).map((entry) => entry.id),
  };
}

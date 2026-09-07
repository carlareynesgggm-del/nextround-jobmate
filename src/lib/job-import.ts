/**
 * Importación de ofertas de empleo a partir de un enlace.
 *
 * Hoy `importJob` solo deduce lo que se puede sacar del propio enlace (sin
 * red): dominio → empresa/origen, e identificadores visibles en la URL.
 * Mañana esta misma función podrá llamar a un servicio que descargue y
 * analice la oferta real; el resto de la app solo depende de esta firma.
 */

export type JobImportResult = {
  /** URL tal cual la pegó la persona, ya validada. */
  jobUrl: string;
  /** Nombre de empresa deducido del dominio, si el portal no es genérico. */
  company: string | null;
  /** Origen legible: LinkedIn, Web de la empresa, Portal universitario… */
  source: string;
  /** Identificador de la oferta encontrado en la URL, si lo hay. */
  externalId: string | null;
  /** Puesto deducido del slug de la URL, cuando es legible. */
  roleTitle: string | null;
};

const KNOWN_PORTALS: Record<string, string> = {
  "linkedin.com": "LinkedIn",
  "indeed.com": "Indeed",
  "glassdoor.com": "Glassdoor",
  "infojobs.net": "InfoJobs",
  "welcometothejungle.com": "Welcome to the Jungle",
  "greenhouse.io": "Greenhouse",
  "lever.co": "Lever",
  "workday.com": "Workday",
  "myworkdayjobs.com": "Workday",
  "smartrecruiters.com": "SmartRecruiters",
  "successfactors.com": "SuccessFactors",
  "jobteaser.com": "Portal universitario",
  "handshake.com": "Portal universitario",
  "ripplematch.com": "Portal universitario",
};

const UNIVERSITY_HINTS = ["career", "careers", "jobteaser", "handshake", "talent", "employability"];

function titleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\.(html?|php)$/i, "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => (word.length > 3 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function findExternalId(url: URL): string | null {
  const idParams = ["currentjobid", "jobid", "job_id", "vjk", "gh_jid", "reqid", "req_id", "id"];
  for (const key of idParams) {
    const value = url.searchParams.get(key);
    if (value) return value;
  }
  const segments = url.pathname.split("/").filter(Boolean);
  for (const segment of segments.reverse()) {
    if (/^[0-9]{4,}$/.test(segment)) return segment;
    if (/^[0-9a-f-]{16,}$/i.test(segment)) return segment;
  }
  return null;
}

/**
 * Deduce empresa, origen, identificador y puesto a partir del propio enlace,
 * sin hacer ninguna petición de red.
 */
export async function importJob(rawUrl: string): Promise<JobImportResult> {
  const trimmed = rawUrl.trim();
  if (!trimmed) throw new Error("Pega el enlace de la oferta.");

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("Ese enlace no parece válido.");
  }

  const host = url.hostname.replace(/^www\./, "");
  const portalKey = Object.keys(KNOWN_PORTALS).find((key) => host === key || host.endsWith(`.${key}`));
  const isUniversityPortal = UNIVERSITY_HINTS.some((hint) => host.includes(hint));

  const base = host.split(".")[0] ?? host;
  const company = portalKey || isUniversityPortal ? null : titleCase(base) || null;
  const source = portalKey
    ? (KNOWN_PORTALS[portalKey] as string)
    : isUniversityPortal
      ? "Portal universitario"
      : "Web de la empresa";

  const segments = url.pathname.split("/").filter(Boolean);
  const lastSlug = segments.find((segment) => /[a-z]/i.test(segment) && segment.length > 4);
  const roleTitle = lastSlug && !/^[0-9a-f-]+$/i.test(lastSlug) ? titleCase(lastSlug) : null;

  return {
    jobUrl: url.toString(),
    company,
    source,
    externalId: findExternalId(url),
    roleTitle,
  };
}

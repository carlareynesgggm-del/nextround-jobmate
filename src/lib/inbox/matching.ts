export type MatchTarget = {
  id: string;
  role_title: string;
  company: string | null;
  job_url?: string | null;
  candidate_portal_url?: string | null;
};

export type ApplicationMatch = {
  id: string | null;
  confident: boolean;
};

function normalizeCompany(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/^lifeat/, "")
    .replace(/^careersat/, "")
    .replace(/^jobsat/, "")
    .replace(/^join/, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function urlDomain(value: string | null | undefined): string | null {
  const normalized = normalizeUrl(value);
  return normalized ? new URL(normalized).hostname.replace(/^www\./, "") : null;
}

export function findBestApplicationMatch({
  company,
  roleTitle,
  jobUrl,
  portalUrl,
  targets,
}: {
  company: string | null | undefined;
  roleTitle: string | null | undefined;
  jobUrl?: string | null;
  portalUrl?: string | null;
  targets: MatchTarget[];
}): ApplicationMatch {
  const extractedCompany = normalizeCompany(company);
  const extractedRole = normalizeText(roleTitle);
  const extractedJobUrl = normalizeUrl(jobUrl);
  const extractedPortalDomain = urlDomain(portalUrl);
  let best: { id: string; score: number } | null = null;
  let tied = false;

  for (const target of targets) {
    const targetCompany = normalizeCompany(target.company);
    const targetRole = normalizeText(target.role_title);
    const targetJobUrl = normalizeUrl(target.job_url);
    const targetPortalDomain = urlDomain(target.candidate_portal_url);
    let score = 0;

    if (extractedJobUrl && targetJobUrl && extractedJobUrl === targetJobUrl) {
      score += 8;
    }

    if (extractedPortalDomain && targetPortalDomain && extractedPortalDomain === targetPortalDomain) {
      score += 4;
    }

    if (extractedCompany && targetCompany && extractedCompany === targetCompany) {
      score += 5;
    }

    if (extractedRole && targetRole) {
      if (extractedRole === targetRole) {
        score += 5;
      } else if (extractedRole.includes(targetRole) || targetRole.includes(extractedRole)) {
        score += 3;
      }
    }

    if (!best || score > best.score) {
      best = { id: target.id, score };
      tied = false;
    } else if (score === best.score) {
      tied = true;
    }
  }

  if (best && best.score >= 7 && !tied) {
    return { id: best.id, confident: true };
  }

  return { id: null, confident: false };
}
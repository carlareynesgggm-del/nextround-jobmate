import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type JobPageData = {
  roleTitle: string | null;
  company: string | null;
  location: string | null;
  country: string | null;
  description: string | null;
  requirements: string | null;
  employmentType: string | null;
  deadlineAt: string | null;
  /** true si realmente hemos podido leer contenido de la página. */
  fetched: boolean;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const EMPTY: JobPageData = {
  roleTitle: null,
  company: null,
  location: null,
  country: null,
  description: null,
  requirements: null,
  employmentType: null,
  deadlineAt: null,
  fetched: false,
};

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripHtml(value: string): string {
  return decode(
    value
      .replace(/<\s*(br|\/p|\/li|\/div)\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n"),
  );
}

function meta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return null;
}

type Unknown = Record<string, unknown>;

function collect(node: unknown, out: Unknown[]) {
  if (Array.isArray(node)) {
    node.forEach((item) => collect(item, out));
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Unknown;
  out.push(obj);
  if (obj["@graph"]) collect(obj["@graph"], out);
}

function jobPostings(html: string): Unknown[] {
  const found: Unknown[] = [];
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const script of scripts) {
    const raw = script[1];
    if (!raw) continue;
    try {
      collect(JSON.parse(raw.trim()), found);
    } catch {
      // JSON-LD inválido: lo ignoramos.
    }
  }
  return found.filter((node) => {
    const type = node["@type"];
    return type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
  });
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseLinkedInTitle(title: string | null): { company: string | null; role: string | null; location: string | null } {
  if (!title) return { company: null, role: null, location: null };
  const clean = title.replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();
  const match = clean.match(/^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+(.+))?$/i);
  if (match) {
    return { company: match[1] ?? null, role: match[2] ?? null, location: match[3] ?? null };
  }
  return { company: null, role: clean || null, location: null };
}

async function readJobPage(rawUrl: string): Promise<JobPageData> {
  let response: Response;
  try {
    response = await fetch(rawUrl, {
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "es-ES,es;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return EMPTY;
  }
  if (!response.ok) return EMPTY;

  const html = (await response.text()).slice(0, 1_200_000);
  const posting = jobPostings(html)[0];

  let roleTitle: string | null = null;
  let company: string | null = null;
  let location: string | null = null;
  let country: string | null = null;
  let description: string | null = null;
  let employmentType: string | null = null;
  let deadlineAt: string | null = null;

  if (posting) {
    roleTitle = text(posting["title"]);
    const org = posting["hiringOrganization"];
    if (org && typeof org === "object") company = text((org as Unknown)["name"]);
    const jobLocation = Array.isArray(posting["jobLocation"])
      ? (posting["jobLocation"][0] as Unknown | undefined)
      : (posting["jobLocation"] as Unknown | undefined);
    const address = jobLocation && typeof jobLocation === "object" ? (jobLocation["address"] as Unknown | undefined) : undefined;
    if (address && typeof address === "object") {
      location = text(address["addressLocality"]) ?? text(address["addressRegion"]);
      country = text(address["addressCountry"]);
      if (!country) {
        const nested = address["addressCountry"];
        if (nested && typeof nested === "object") country = text((nested as Unknown)["name"]);
      }
    }
    const rawDescription = text(posting["description"]);
    if (rawDescription) description = stripHtml(rawDescription).slice(0, 4000);
    const type = posting["employmentType"];
    employmentType = text(type) ?? (Array.isArray(type) ? text(type[0]) : null);
    const validThrough = text(posting["validThrough"]);
    if (validThrough) deadlineAt = validThrough.slice(0, 10);
  }

  const ogTitle = meta(html, "og:title");
  const ogDescription = meta(html, "og:description");
  const parsed = parseLinkedInTitle(ogTitle);

  roleTitle = roleTitle ?? parsed.role;
  company = company ?? parsed.company;
  location = location ?? parsed.location;
  if (!description && ogDescription) {
    description = ogDescription.replace(/See this and similar jobs on LinkedIn\.?$/i, "").trim() || null;
  }

  const fetched = Boolean(roleTitle || company || description);
  return { roleTitle, company, location, country, description, requirements: null, employmentType, deadlineAt, fetched };
}

export const fetchJobPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ url: z.string().url().max(2000) }).parse(data))
  .handler(async ({ data }): Promise<JobPageData> => {
    const url = new URL(data.url);
    if (url.protocol !== "https:" && url.protocol !== "http:") return EMPTY;
    const host = url.hostname.toLowerCase();
    // Evitamos usar el servidor como proxy hacia redes internas.
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(host)
    ) {
      return EMPTY;
    }
    return readJobPage(url.toString());
  });

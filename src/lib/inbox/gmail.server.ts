import { createCipheriv, createDecipheriv, createHmac, randomBytes, createHash } from "node:crypto";

/* ------------------------------- secretos -------------------------------- */

function tokenKey(): Buffer {
  const raw = process.env["GMAIL_TOKEN_SECRET"];
  if (!raw) throw new Error("Falta GMAIL_TOKEN_SECRET en el servidor.");
  return createHash("sha256").update(raw).digest();
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptToken(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const decipher = createDecipheriv("aes-256-gcm", tokenKey(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

/** Firma el estado de OAuth para que el callback sepa de qué usuario viene. */
export function signState(payload: { uid: string; exp: number; redirect: string }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", tokenKey()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyState(state: string): { uid: string; redirect: string } | null {
  const [body, mac] = state.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", tokenKey()).update(body).digest("base64url");
  if (mac !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      uid?: string;
      exp?: number;
      redirect?: string;
    };
    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
    return { uid: parsed.uid, redirect: parsed.redirect ?? "/settings" };
  } catch {
    return null;
  }
}

/* --------------------------------- OAuth --------------------------------- */

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function googleCreds() {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new Error(
      "Gmail no está configurado todavía: faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
    );
  }
  return { clientId, clientSecret };
}

/** URI de callback: la del entorno si existe, si no la del propio origen. */
export function redirectUri(origin: string): string {
  return process.env["GOOGLE_REDIRECT_URI"] || `${origin}/api/public/gmail/callback`;
}

export function authorizeUrl(origin: string, state: string): string {
  const { clientId } = googleCreds();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export async function exchangeCode(code: string, origin: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = googleCreds();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  return (await res.json()) as TokenResponse;
}

export async function accessTokenFromRefresh(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = googleCreds();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as TokenResponse;
  if (!json.access_token) {
    throw new Error(json.error_description ?? json.error ?? "Google rechazó el token de Gmail.");
  }
  return json.access_token;
}

export async function googleEmailAddress(accessToken: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { email?: string; sub?: string };
  return json.email ?? null;
}

/* --------------------------------- Gmail --------------------------------- */

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

const RECRUITMENT_QUERY =
  'newer_than:45d -in:spam (application OR candidatura OR candidature OR bewerbung OR interview OR entrevista OR entretien OR assessment OR "online test" OR prueba OR recruiter OR recruitment OR reclutamiento OR hiring OR internship OR "graduate programme" OR "graduate program" OR practicas OR vacancy OR "job" OR offer OR oferta OR "next stage" OR "siguiente fase" OR shortlist OR "we regret")';

export type GmailMessage = {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  subject: string;
  fromName: string;
  fromEmail: string;
};

function header(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name)?.value ?? "";
}

export async function fetchRecruitmentMessages(
  accessToken: string,
  max = 25,
): Promise<GmailMessage[]> {
  const listUrl = new URL(`${GMAIL}/messages`);
  listUrl.searchParams.set("q", RECRUITMENT_QUERY);
  listUrl.searchParams.set("maxResults", String(max));
  const listRes = await fetch(listUrl, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!listRes.ok) {
    throw new Error(`Gmail respondió ${listRes.status}: ${await listRes.text()}`);
  }
  const list = (await listRes.json()) as { messages?: { id: string }[] };
  const ids = (list.messages ?? []).map((m) => m.id);

  const messages: GmailMessage[] = [];
  for (const id of ids) {
    const url = new URL(`${GMAIL}/messages/${id}`);
    url.searchParams.set("format", "metadata");
    for (const h of ["From", "Subject", "Date"]) url.searchParams.append("metadataHeaders", h);
    const res = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
    if (!res.ok) continue;
    const msg = (await res.json()) as {
      id: string;
      threadId: string;
      snippet?: string;
      internalDate?: string;
      payload?: { headers?: { name: string; value: string }[] };
    };
    const headers = msg.payload?.headers ?? [];
    const from = header(headers, "from");
    const match = /^(.*?)\s*<([^>]+)>$/.exec(from);
    messages.push({
      id: msg.id,
      threadId: msg.threadId,
      snippet: msg.snippet ?? "",
      internalDate: msg.internalDate ?? String(Date.now()),
      subject: header(headers, "subject"),
      fromName: (match?.[1] ?? from).replace(/^"|"$/g, "").trim(),
      fromEmail: (match?.[2] ?? from).trim().toLowerCase(),
    });
  }
  return messages;
}

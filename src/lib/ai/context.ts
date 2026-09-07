import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || "";
const SUPABASE_ANON_KEY =
  process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";

/** Cliente Supabase autenticado con el JWT del usuario (respeta RLS). */
export function supabaseForUser(accessToken: string) {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function daysSince(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const ms = Date.now() - new Date(dateIso).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/**
 * Construye un contexto textual (Markdown) con los datos reales del usuario
 * respetando RLS: candidaturas activas, hitos, contactos, tareas y eventos.
 * Si `applicationId` viene informado, se prioriza esa candidatura con detalle completo.
 */
export async function buildUserContext(accessToken: string, applicationId?: string | null) {
  const db = supabaseForUser(accessToken);

  const { data: userData } = await db.auth.getUser();
  const user = userData.user;

  const [{ data: applications }, { data: tasks }, { data: events }, { data: notes }, { data: contacts }] =
    await Promise.all([
      db
        .from("applications")
        .select("*, companies(id,name,industry,location,website)")
        .order("updated_at", { ascending: false }),
      db.from("tasks").select("*").order("due_date", { ascending: true }).limit(30),
      db.from("calendar_events").select("*").order("starts_at", { ascending: true }).limit(30),
      db.from("notes").select("*").order("created_at", { ascending: false }).limit(40),
      db.from("contacts").select("*").limit(60),
    ]);

  const apps = applications ?? [];
  const active = apps.filter((a) => !a.archived && !["rejected", "withdrawn", "ghosted"].includes(a.stage));

  const timelineByApp: Record<string, any[]> = {};
  const appDocsByApp: Record<string, any[]> = {};
  const relevantIds = applicationId ? [applicationId] : active.map((a) => a.id).slice(0, 12);
  if (relevantIds.length > 0) {
    const { data: timeline } = await db
      .from("application_events")
      .select("*")
      .in("application_id", relevantIds)
      .order("scheduled_at", { ascending: true });
    const { data: appDocs } = await db
      .from("application_documents")
      .select("*, documents(id,name,kind)")
      .in("application_id", relevantIds);
    for (const ev of timeline ?? []) {
      (timelineByApp[ev["application_id"]] ??= []).push(ev);
    }
    for (const d of appDocs ?? []) {
      (appDocsByApp[d["application_id"]] ??= []).push(d);
    }
  }

  function appBlock(a: (typeof apps)[number], detailed: boolean): string {
    const company = a.companies?.name ?? "Empresa sin nombre";
    const days = daysSince(a.applied_at);
    const lines = [
      `### ${company} — ${a.role_title}`,
      `Etapa: ${a.stage}${days !== null ? ` · ${days} días desde la solicitud` : ""}`,
      a.location ? `Ubicación: ${a.location}` : null,
      a.salary_min || a.salary_max
        ? `Salario: ${a.salary_min ?? "?"}-${a.salary_max ?? "?"} ${a.currency ?? ""}`
        : null,
      a.jd_salary_text ? `Salario (oferta): ${a.jd_salary_text}` : null,
      a.description ? `Descripción: ${a.description.slice(0, detailed ? 1200 : 300)}` : null,
      a.jd_requirements ? `Requisitos: ${a.jd_requirements.slice(0, detailed ? 1200 : 300)}` : null,
      a.jd_responsibilities && detailed ? `Responsabilidades: ${a.jd_responsibilities.slice(0, 800)}` : null,
      a.next_action ? `Próxima acción prevista: ${a.next_action}` : null,
      a.deadline_at ? `Fecha límite: ${a.deadline_at}` : null,
    ];
    const timeline = timelineByApp[a.id] ?? [];
    if (timeline.length > 0) {
      lines.push(
        "Hitos del proceso:",
        ...timeline.map(
          (ev) =>
            `  · ${ev.stage_type} — estado ${ev.status}${ev.scheduled_at ? `, agendado ${ev.scheduled_at}` : ""}${
              ev.deadline_at ? `, límite ${ev.deadline_at}` : ""
            }${ev.interviewer ? `, con ${ev.interviewer}` : ""}${ev.provider ? ` (${ev.provider})` : ""}${
              ev.prep_notes ? `. Notas de preparación: ${ev.prep_notes}` : ""
            }${ev.went_well ? `. Cómo fue: ${ev.went_well}` : ""}${
              ev.next_steps ? `. Próximos pasos: ${ev.next_steps}` : ""
            }`,
        ),
      );
    }
    const docs = appDocsByApp[a.id] ?? [];
    if (docs.length > 0) {
      lines.push(
        `Documentos enviados: ${docs.map((d) => d.documents?.name ?? d.documents?.kind ?? "documento").join(", ")}`,
      );
    }
    return lines.filter(Boolean).join("\n");
  }

  const parts: string[] = [];

  if (applicationId) {
    const target = apps.find((a) => a.id === applicationId);
    if (target) {
      parts.push("## Candidatura priorizada por el usuario", appBlock(target, true));
    }
  }

  parts.push(
    `## Candidaturas activas (${active.length})`,
    ...active.slice(0, 15).map((a) => appBlock(a, a.id === applicationId)),
  );

  if (contacts && contacts.length > 0) {
    parts.push(
      "## Contactos",
      ...contacts
        .slice(0, 20)
        .map((c) => `· ${c.name}${c.role_title ? ` (${c.role_title})` : ""}${c.contact_type ? ` — ${c.contact_type}` : ""}`),
    );
  }

  if (tasks && tasks.length > 0) {
    parts.push(
      "## Tareas pendientes",
      ...tasks
        .filter((t) => !t.done)
        .slice(0, 15)
        .map((t) => `· ${t.title}${t.due_date ? ` (vence ${t.due_date})` : ""}`),
    );
  }

  if (events && events.length > 0) {
    const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= Date.now());
    parts.push(
      "## Próximos eventos",
      ...upcoming.slice(0, 10).map((e) => `· ${e.title} — ${e.starts_at}`),
    );
  }

  if (notes && notes.length > 0) {
    parts.push(
      "## Notas previas relevantes",
      ...notes.slice(0, 10).map((n) => `· ${n.body?.slice(0, 200) ?? ""}`),
    );
  }

  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const fullName = typeof meta?.["full_name"] === "string" ? (meta["full_name"] as string) : undefined;

  return {
    userName: fullName?.split(" ")?.[0] || user?.email?.split("@")[0] || "candidato/a",
    activeCount: active.length,
    applications: apps,
    contextMarkdown: parts.join("\n\n"),
  };
}

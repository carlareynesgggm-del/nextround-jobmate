import { tool } from "ai";
import { z } from "zod";

import { supabaseForUser } from "@/lib/ai/context";

/**
 * Herramientas de SOLO LECTURA para el copiloto.
 * Todas usan el cliente Supabase con el JWT del usuario, así que RLS garantiza
 * que la IA nunca puede leer datos de otra persona. Ninguna escribe datos.
 */
export function readOnlyTools(accessToken: string, applicationId?: string | null) {
  const db = supabaseForUser(accessToken);

  const appSelect = "*, companies(id,name,industry,location,website)";

  async function resolveAppId(input?: string | null) {
    if (input && input.trim().length > 0) return input.trim();
    return applicationId ?? null;
  }

  const noApp = { error: "no_application_context", message: "No hay ninguna candidatura en contexto." };

  return {
    get_current_application: tool({
      description:
        "Devuelve la candidatura abierta ahora mismo por el usuario (empresa, puesto, etapa, fechas, oferta guardada, portal).",
      inputSchema: z.object({}),
      execute: async () => {
        if (!applicationId) return noApp;
        const { data, error } = await db.from("applications").select(appSelect).eq("id", applicationId).maybeSingle();
        if (error) return { error: "read_failed", message: error.message };
        return data ?? { error: "not_found" };
      },
    }),

    get_active_applications: tool({
      description:
        "Lista las candidaturas activas del usuario (no rechazadas, retiradas ni archivadas) con etapa, fechas y próxima acción. Útil para priorizar o comparar.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).nullable(),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await db
          .from("applications")
          .select("id, role_title, stage, applied_at, deadline_at, next_action, location, archived, companies(name)")
          .order("updated_at", { ascending: false })
          .limit(limit ?? 25);
        if (error) return { error: "read_failed", message: error.message };
        return (data ?? []).filter(
          (a) => !a.archived && !["rejected", "withdrawn", "ghosted"].includes(a.stage as string),
        );
      },
    }),

    find_application: tool({
      description:
        "Busca una candidatura por nombre de empresa o puesto. Úsalo cuando el usuario mencione una candidatura distinta a la abierta (por ejemplo para comparar dos).",
      inputSchema: z.object({ query: z.string().min(1) }),
      execute: async ({ query }) => {
        const { data, error } = await db.from("applications").select(appSelect).limit(60);
        if (error) return { error: "read_failed", message: error.message };
        const q = query.toLowerCase();
        const hits = (data ?? []).filter(
          (a) =>
            (a.companies?.name ?? "").toLowerCase().includes(q) ||
            (a.role_title ?? "").toLowerCase().includes(q),
        );
        return hits.slice(0, 5);
      },
    }),

    get_timeline: tool({
      description:
        "Cronología del proceso de una candidatura: hitos/entrevistas/pruebas con estado, fechas, entrevistador, notas de preparación y próximos pasos.",
      inputSchema: z.object({ application_id: z.string().nullable() }),
      execute: async ({ application_id }) => {
        const id = await resolveAppId(application_id);
        if (!id) return noApp;
        const [timeline, activity] = await Promise.all([
          db.from("application_events").select("*").eq("application_id", id).order("scheduled_at", { ascending: true }),
          db
            .from("activity_feed")
            .select("title, detail, source, occurred_at")
            .eq("application_id", id)
            .order("occurred_at", { ascending: false })
            .limit(30),
        ]);
        return { milestones: timeline.data ?? [], activity: activity.data ?? [] };
      },
    }),

    get_related_emails: tool({
      description:
        "Correos de Gmail detectados y vinculados a una candidatura (asunto, remitente, tipo, fecha, estado y datos extraídos). Úsalo para explicar qué significa un correo o qué ha cambiado.",
      inputSchema: z.object({
        application_id: z.string().nullable(),
        limit: z.number().int().min(1).max(30).nullable(),
      }),
      execute: async ({ application_id, limit }) => {
        const id = await resolveAppId(application_id);
        if (!id) return noApp;
        const { data, error } = await db
          .from("email_events")
          .select("subject, from_email, from_name, email_type, received_at, status, extracted")
          .eq("application_id", id)
          .order("received_at", { ascending: false })
          .limit(limit ?? 15);
        if (error) return { error: "read_failed", message: error.message };
        return data ?? [];
      },
    }),

    get_documents: tool({
      description:
        "Documentos y CV del usuario. Sin application_id devuelve todo el CV Vault (para comparar versiones); con application_id devuelve los documentos exactos enviados a esa candidatura.",
      inputSchema: z.object({ application_id: z.string().nullable() }),
      execute: async ({ application_id }) => {
        if (application_id === null && !applicationId) {
          const { data, error } = await db
            .from("documents")
            .select("id, name, kind, version_label, created_at, updated_at")
            .order("updated_at", { ascending: false })
            .limit(40);
          if (error) return { error: "read_failed", message: error.message };
          return { vault: data ?? [] };
        }
        const id = await resolveAppId(application_id);
        if (!id) return noApp;
        const [links, vault] = await Promise.all([
          db
            .from("application_documents")
            .select("*, documents(id,name,kind,version_label,created_at,updated_at)")
            .eq("application_id", id),
          db
            .from("documents")
            .select("id, name, kind, version_label, updated_at")
            .order("updated_at", { ascending: false })
            .limit(40),
        ]);
        return { sent: links.data ?? [], vault: vault.data ?? [] };
      },
    }),

    get_tasks_and_events: tool({
      description:
        "Tareas y eventos de calendario. Con application_id se limita a esa candidatura; sin él devuelve los del usuario completo.",
      inputSchema: z.object({ application_id: z.string().nullable() }),
      execute: async ({ application_id }) => {
        const id = application_id ?? null;
        let tasksQuery = db.from("tasks").select("*").order("due_date", { ascending: true }).limit(40);
        let eventsQuery = db.from("calendar_events").select("*").order("starts_at", { ascending: true }).limit(40);
        if (id) {
          tasksQuery = tasksQuery.eq("application_id", id) as typeof tasksQuery;
          eventsQuery = eventsQuery.eq("application_id", id) as typeof eventsQuery;
        }
        const [tasks, events] = await Promise.all([tasksQuery, eventsQuery]);
        return { tasks: tasks.data ?? [], events: events.data ?? [] };
      },
    }),

    get_notes: tool({
      description: "Notas guardadas por el usuario, opcionalmente de una candidatura concreta.",
      inputSchema: z.object({ application_id: z.string().nullable() }),
      execute: async ({ application_id }) => {
        let q = db.from("notes").select("*").order("created_at", { ascending: false }).limit(30);
        if (application_id) q = q.eq("application_id", application_id) as typeof q;
        const { data, error } = await q;
        if (error) return { error: "read_failed", message: error.message };
        return data ?? [];
      },
    }),

    get_upcoming_deadlines: tool({
      description:
        "Fechas límite y próximos compromisos del usuario en los próximos N días: deadlines de candidaturas, hitos con límite, eventos de calendario y tareas con vencimiento.",
      inputSchema: z.object({ days: z.number().int().min(1).max(120).nullable() }),
      execute: async ({ days }) => {
        const window = days ?? 21;
        const nowIso = new Date().toISOString();
        const untilIso = new Date(Date.now() + window * 86_400_000).toISOString();
        const [apps, milestones, events, tasks] = await Promise.all([
          db
            .from("applications")
            .select("id, role_title, deadline_at, stage, companies(name)")
            .not("deadline_at", "is", null)
            .lte("deadline_at", untilIso)
            .order("deadline_at", { ascending: true })
            .limit(25),
          db
            .from("application_events")
            .select("application_id, stage_type, status, deadline_at, scheduled_at")
            .not("deadline_at", "is", null)
            .lte("deadline_at", untilIso)
            .order("deadline_at", { ascending: true })
            .limit(25),
          db
            .from("calendar_events")
            .select("application_id, title, starts_at, location")
            .gte("starts_at", nowIso)
            .lte("starts_at", untilIso)
            .order("starts_at", { ascending: true })
            .limit(25),
          db
            .from("tasks")
            .select("application_id, title, due_date, done")
            .eq("done", false)
            .not("due_date", "is", null)
            .lte("due_date", untilIso)
            .order("due_date", { ascending: true })
            .limit(25),
        ]);
        return {
          window_days: window,
          application_deadlines: apps.data ?? [],
          milestone_deadlines: milestones.data ?? [],
          calendar_events: events.data ?? [],
          tasks: tasks.data ?? [],
        };
      },
    }),
  };
}

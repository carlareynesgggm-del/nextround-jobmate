import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/api";
import type {
  ActivityRow,
  AlertRow,
  EmailConnectionRow,
  EmailEventRow,
  EmailSuggestionRow,
} from "@/lib/inbox/domain";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export const inboxKeys = {
  connections: ["email", "connections"] as const,
  events: ["email", "events"] as const,
  suggestions: (eventId: string) => ["email", "suggestions", eventId] as const,
  activity: (applicationId: string) => ["activity", applicationId] as const,
  alerts: ["alerts"] as const,
};

/* ------------------------------- conexiones ------------------------------- */

export function useEmailConnections() {
  return useQuery({
    queryKey: inboxKeys.connections,
    queryFn: async () =>
      unwrap(
        await supabase.from("email_connections").select("*").order("created_at"),
      ) as EmailConnectionRow[],
  });
}

export function useUpdateEmailConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<EmailConnectionRow> }) =>
      unwrap(await supabase.from("email_connections").update(patch).eq("id", id).select().single()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: inboxKeys.connections }),
  });
}

export function useDisconnectEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_connections").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: inboxKeys.connections }),
  });
}

/* ----------------------------- correos detectados ------------------------- */

export function useEmailEvents(status?: string) {
  return useQuery({
    queryKey: [...inboxKeys.events, status ?? "all"],
    queryFn: async () => {
      let query = supabase.from("email_events").select("*").order("received_at", { ascending: false });
      if (status) query = query.eq("status", status);
      return unwrap(await query) as EmailEventRow[];
    },
  });
}

export function useEmailSuggestions(eventId: string | null) {
  return useQuery({
    queryKey: inboxKeys.suggestions(eventId ?? "none"),
    enabled: Boolean(eventId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("email_suggestions")
          .select("*")
          .eq("email_event_id", eventId!)
          .order("position"),
      ) as EmailSuggestionRow[],
  });
}

export function useIgnoreEmailEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("email_events")
        .update({ status: "ignored" })
        .eq("id", eventId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: inboxKeys.events }),
  });
}

/** Asocia un correo ambiguo a la candidatura elegida por la persona. */
export function useMatchEmailEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, applicationId }: { eventId: string; applicationId: string }) => {
      const { error } = await supabase
        .from("email_events")
        .update({ application_id: applicationId, status: "pending" })
        .eq("id", eventId);
      if (error) throw new Error(error.message);
      await supabase
        .from("email_suggestions")
        .update({ application_id: applicationId })
        .eq("email_event_id", eventId);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: inboxKeys.events });
      void qc.invalidateQueries({ queryKey: inboxKeys.suggestions(vars.eventId) });
    },
  });
}

/* ------------------------------ historial y avisos ------------------------ */

export function useActivity(applicationId: string) {
  return useQuery({
    queryKey: inboxKeys.activity(applicationId),
    enabled: Boolean(applicationId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("activity_feed")
          .select("*")
          .eq("application_id", applicationId)
          .order("occurred_at", { ascending: false }),
      ) as ActivityRow[],
  });
}

export function useRecentActivity(limit = 8) {
  return useQuery({
    queryKey: ["activity", "recent", limit],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("activity_feed")
          .select("*")
          .order("occurred_at", { ascending: false })
          .limit(limit),
      ) as ActivityRow[],
  });
}

export function useLogActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: {
      application_id: string;
      kind: string;
      title: string;
      detail?: string | null;
      source?: string;
      occurred_at?: string;
    }) => unwrap(await supabase.from("activity_feed").insert(row).select().single()),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: inboxKeys.activity(vars.application_id) });
      void qc.invalidateQueries({ queryKey: ["activity", "recent"] });
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: inboxKeys.alerts,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("alerts")
          .select("*")
          .eq("resolved", false)
          .order("created_at", { ascending: false }),
      ) as AlertRow[],
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").update({ resolved: true }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: inboxKeys.alerts }),
  });
}

export function useMarkAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await supabase.from("alerts").update({ read: true }).in("id", ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: inboxKeys.alerts }),
  });
}

/** Claves de datos que puede tocar la confirmación de cambios de un correo. */
export const affectedKeys = [
  qk.applications,
  qk.calendar,
  qk.tasks,
  qk.contacts,
  inboxKeys.events,
  inboxKeys.alerts,
];

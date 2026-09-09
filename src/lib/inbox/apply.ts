import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/api";
import { affectedKeys, inboxKeys } from "@/lib/inbox/api";
import type { EmailEventRow, EmailSuggestionRow } from "@/lib/inbox/domain";

type Payload = Record<string, unknown>;

function str(payload: Payload, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function num(payload: Payload, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function ensureCompany(name: string): Promise<string | null> {
  const existing = await supabase.from("companies").select("id").ilike("name", name).limit(1);
  if (existing.data?.[0]) return existing.data[0].id;
  const created = await supabase.from("companies").insert({ name }).select("id").single();
  return created.data?.id ?? null;
}

/**
 * Aplica una sugerencia concreta a los datos reales de la persona.
 * Nada se ejecuta sin que la persona lo haya marcado y confirmado.
 */
async function applyOne(
  suggestion: EmailSuggestionRow,
  event: EmailEventRow,
): Promise<string | null> {
  const payload = (suggestion.payload ?? {}) as Payload;
  const applicationId = suggestion.application_id ?? event.application_id;

  switch (suggestion.kind) {
    case "stage": {
      const stage = str(payload, "stage");
      if (!applicationId || !stage) return null;
      await supabase
        .from("applications")
        .update({ stage: stage as never, updated_at: new Date().toISOString() })
        .eq("id", applicationId);
      return applicationId;
    }
    case "deadline": {
      const deadline = str(payload, "deadline_at");
      if (!applicationId || !deadline) return null;
      await supabase.from("applications").update({ deadline_at: deadline }).eq("id", applicationId);
      return applicationId;
    }
    case "offer": {
      if (!applicationId) return null;
      await supabase
        .from("applications")
        .update({
          offer_salary: num(payload, "offer_salary"),
          offer_currency: str(payload, "offer_currency"),
          offer_deadline_at: str(payload, "offer_deadline_at"),
        })
        .eq("id", applicationId);
      return applicationId;
    }
    case "link": {
      if (!applicationId) return null;
      const portal = str(payload, "candidate_portal_url");
      const job = str(payload, "job_url");
      if (!portal && !job) return null;
      await supabase
        .from("applications")
        .update({
          ...(portal ? { candidate_portal_url: portal } : {}),
          ...(job ? { job_url: job } : {}),
        })
        .eq("id", applicationId);
      return applicationId;
    }
    case "interview":
    case "assessment": {
      if (!applicationId) return null;
      await supabase.from("application_events").insert({
        application_id: applicationId,
        title: str(payload, "title") ?? suggestion.label,
        kind: (suggestion.kind === "interview" ? "interview" : "test") as never,
        status: "upcoming",
        scheduled_at: str(payload, "scheduled_at"),
        deadline_at: str(payload, "deadline_at"),
        duration_min: num(payload, "duration_min"),
        meeting_url: str(payload, "meeting_url"),
        assessment_url: str(payload, "assessment_url"),
        location: str(payload, "location"),
        timezone: str(payload, "timezone"),
        interviewer: str(payload, "interviewer"),
        provider: str(payload, "provider"),
        instructions: str(payload, "instructions"),
        detail: suggestion.detail,
      });
      return applicationId;
    }
    case "calendar": {
      const startsAt = str(payload, "starts_at");
      if (!startsAt) return null;
      await supabase.from("calendar_events").insert({
        application_id: applicationId,
        title: str(payload, "title") ?? suggestion.label,
        kind: (str(payload, "kind") ?? "interview") as never,
        starts_at: startsAt,
        duration_min: num(payload, "duration_min") ?? 45,
        location: str(payload, "location"),
        notes: suggestion.detail,
      });
      return applicationId;
    }
    case "task": {
      await supabase.from("tasks").insert({
        application_id: applicationId,
        title: str(payload, "title") ?? suggestion.label,
        due_date: str(payload, "due_date"),
        priority: str(payload, "priority") ?? "medium",
      });
      return applicationId;
    }
    case "contact": {
      const name = str(payload, "name");
      if (!name) return null;
      await supabase.from("contacts").insert({
        application_id: applicationId,
        name,
        role_title: str(payload, "role_title"),
        email: str(payload, "email"),
        contact_type: str(payload, "contact_type") ?? "recruiter",
      });
      return applicationId;
    }
    case "new_application": {
      const roleTitle = str(payload, "role_title");
      if (!roleTitle) return null;
      const companyName = str(payload, "company");
      const companyId = companyName ? await ensureCompany(companyName) : null;
      const created = await supabase
        .from("applications")
        .insert({
          role_title: roleTitle,
          company_id: companyId,
          stage: (str(payload, "stage") ?? "applied") as never,
          source: str(payload, "source"),
          job_url: str(payload, "job_url"),
          candidate_portal_url: str(payload, "candidate_portal_url"),
          application_ref: str(payload, "application_ref"),
          applied_at: str(payload, "applied_at"),
        })
        .select("id")
        .single();
      const newId = created.data?.id ?? null;
      if (newId) await supabase.from("email_events").update({ application_id: newId }).eq("id", event.id);
      return newId;
    }
    default:
      return applicationId;
  }
}

export function useApplyEmailSuggestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      event,
      suggestions,
    }: {
      event: EmailEventRow;
      suggestions: EmailSuggestionRow[];
    }) => {
      let applicationId = event.application_id;
      for (const suggestion of suggestions) {
        const touched = await applyOne(suggestion, event);
        if (touched) applicationId = touched;
        await supabase.from("email_suggestions").update({ status: "applied" }).eq("id", suggestion.id);
      }

      await supabase.from("activity_feed").insert({
        application_id: applicationId,
        email_event_id: event.id,
        kind: "email",
        title: event.subject ?? "Correo del proceso",
        detail: event.snippet,
        source: "email",
        occurred_at: event.received_at,
      });

      await supabase.from("email_events").update({ status: "applied" }).eq("id", event.id);
    },
    onSuccess: (_data, vars) => {
      for (const key of affectedKeys) void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: inboxKeys.suggestions(vars.event.id) });
      void qc.invalidateQueries({ queryKey: ["activity"] });
      void qc.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type {
  AppDocumentRow,
  AppDocumentWithDoc,
  ApplicationRow,
  ApplicationWithCompany,
  CalendarRow,
  CompanyRow,
  ContactRow,
  DocumentRow,
  NoteRow,
  Stage,
  TaskRow,
  TimelineRow,
} from "@/lib/domain";


const APP_SELECT = "*, companies(id,name,industry,location,website)";

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Necesitas iniciar sesión.");
  return data.user.id;
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export const qk = {
  applications: ["applications"] as const,
  application: (id: string) => ["application", id] as const,
  timeline: (id: string) => ["timeline", id] as const,
  appDocs: (id: string) => ["appDocs", id] as const,
  allAppDocs: ["appDocs", "all"] as const,

  companies: ["companies"] as const,
  contacts: ["contacts"] as const,
  tasks: ["tasks"] as const,
  notes: ["notes"] as const,
  documents: ["documents"] as const,
  calendar: ["calendar"] as const,
  profile: ["profile"] as const,
};

/* ---------------------------------- reads --------------------------------- */

export function useApplications() {
  return useQuery({
    queryKey: qk.applications,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("applications")
          .select(APP_SELECT)
          .order("updated_at", { ascending: false }),
      ) as ApplicationWithCompany[],
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: qk.application(id),
    queryFn: async () =>
      unwrap(
        await supabase.from("applications").select(APP_SELECT).eq("id", id).maybeSingle(),
      ) as ApplicationWithCompany | null,
  });
}

export function useTimeline(applicationId: string) {
  return useQuery({
    queryKey: qk.timeline(applicationId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("application_events")
          .select("*")
          .eq("application_id", applicationId)
          .order("occurred_at", { ascending: false }),
      ) as TimelineRow[],
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: qk.companies,
    queryFn: async () =>
      unwrap(await supabase.from("companies").select("*").order("name")) as CompanyRow[],
  });
}

export function useContacts() {
  return useQuery({
    queryKey: qk.contacts,
    queryFn: async () =>
      unwrap(await supabase.from("contacts").select("*").order("name")) as ContactRow[],
  });
}

export function useTasks() {
  return useQuery({
    queryKey: qk.tasks,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("tasks")
          .select("*")
          .order("done")
          .order("due_date", { ascending: true, nullsFirst: false }),
      ) as TaskRow[],
  });
}

export function useNotes() {
  return useQuery({
    queryKey: qk.notes,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("notes")
          .select("*")
          .order("pinned", { ascending: false })
          .order("updated_at", { ascending: false }),
      ) as NoteRow[],
  });
}

export function useDocuments() {
  return useQuery({
    queryKey: qk.documents,
    queryFn: async () =>
      unwrap(
        await supabase.from("documents").select("*").order("created_at", { ascending: false }),
      ) as DocumentRow[],
  });
}

export function useCalendar() {
  return useQuery({
    queryKey: qk.calendar,
    queryFn: async () =>
      unwrap(
        await supabase.from("calendar_events").select("*").order("starts_at"),
      ) as CalendarRow[],
  });
}

export function useProfile() {
  return useQuery({
    queryKey: qk.profile,
    queryFn: async () => {
      const userId = await currentUserId();
      return unwrap(await supabase.from("profiles").select("*").eq("id", userId).maybeSingle());
    },
  });
}

/* -------------------------------- mutations ------------------------------- */

type ApplicationInput = Partial<ApplicationRow> & { role_title: string };

export function useSaveApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: ApplicationInput }): Promise<{ id: string }> => {
      if (id) {
        return unwrap(
          await supabase.from("applications").update(values).eq("id", id).select("id").single(),
        );
      }
      const userId = await currentUserId();
      return unwrap(
        await supabase
          .from("applications")
          .insert({ ...values, user_id: userId })
          .select("id")
          .single(),
      );
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: qk.applications });
      qc.invalidateQueries({ queryKey: qk.application(row.id) });
    },

  });
}

export function useMoveStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      application,
      to,
    }: {
      application: ApplicationRow;
      to: Stage;
    }) => {
      const patch: Partial<ApplicationRow> = { stage: to };
      if (to !== "saved" && !application.applied_at) {
        patch.applied_at = new Date().toISOString().slice(0, 10);
      }
      unwrap(await supabase.from("applications").update(patch).eq("id", application.id).select("id"));
      await supabase.from("application_events").insert({
        application_id: application.id,
        user_id: application.user_id,
        is_demo: application.is_demo,
        title: "Cambio de etapa",
        from_stage: application.stage,
        to_stage: to,
      });
      return true;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.applications });
      qc.invalidateQueries({ queryKey: qk.application(vars.application.id) });
      qc.invalidateQueries({ queryKey: qk.timeline(vars.application.id) });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.applications }),
  });
}

export function useSaveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Partial<CompanyRow> }) => {
      if (id) {
        return unwrap(await supabase.from("companies").update(values).eq("id", id).select().single());
      }
      const userId = await currentUserId();
      return unwrap(
        await supabase
          .from("companies")
          .insert({ ...values, name: values.name ?? "Sin nombre", user_id: userId })
          .select()
          .single(),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.companies });
      qc.invalidateQueries({ queryKey: qk.applications });
    },
  });
}

export function useSaveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Partial<TaskRow> }) => {
      if (id) {
        return unwrap(await supabase.from("tasks").update(values).eq("id", id).select().single());
      }
      const userId = await currentUserId();
      return unwrap(
        await supabase
          .from("tasks")
          .insert({ ...values, title: values.title ?? "Nueva tarea", user_id: userId })
          .select()
          .single(),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  });
}

export function useSaveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Partial<NoteRow> }) => {
      if (id) {
        return unwrap(await supabase.from("notes").update(values).eq("id", id).select().single());
      }
      const userId = await currentUserId();
      return unwrap(
        await supabase
          .from("notes")
          .insert({ ...values, body: values.body ?? "", user_id: userId })
          .select()
          .single(),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });
}

export function useSaveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Partial<CalendarRow> }) => {
      if (id) {
        return unwrap(
          await supabase.from("calendar_events").update(values).eq("id", id).select().single(),
        );
      }
      const userId = await currentUserId();
      return unwrap(
        await supabase
          .from("calendar_events")
          .insert({
            ...values,
            title: values.title ?? "Nuevo evento",
            starts_at: values.starts_at ?? new Date().toISOString(),
            user_id: userId,
          })
          .select()
          .single(),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.calendar }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.calendar }),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      name,
      kind,
      version,
    }: {
      file: File;
      name: string;
      kind: DocumentRow["kind"];
      version: string;
    }) => {
      const userId = await currentUserId();
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const upload = await supabase.storage.from("documents").upload(path, file);
      if (upload.error) throw new Error(upload.error.message);
      return unwrap(
        await supabase
          .from("documents")
          .insert({
            user_id: userId,
            name,
            kind,
            version: version || null,
            storage_path: path,
            mime_type: file.type,
            size_bytes: file.size,
          })
          .select()
          .single(),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DocumentRow) => {
      if (doc.storage_path) await supabase.storage.from("documents").remove([doc.storage_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents }),
  });
}

export function useSetDefaultDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DocumentRow) => {
      await supabase.from("documents").update({ is_default: false }).eq("kind", doc.kind);
      const { error } = await supabase
        .from("documents")
        .update({ is_default: true })
        .eq("id", doc.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents }),
  });
}

export async function documentUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

export function useAddTimelineEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      application,
      title,
      detail,
    }: {
      application: ApplicationRow;
      title: string;
      detail?: string;
    }) =>
      unwrap(
        await supabase
          .from("application_events")
          .insert({
            application_id: application.id,
            user_id: application.user_id,
            is_demo: application.is_demo,
            title,
            detail: detail ?? null,
            to_stage: application.stage,
          })
          .select()
          .single(),
      ),
    onSuccess: (_row, vars) =>
      qc.invalidateQueries({ queryKey: qk.timeline(vars.application.id) }),
  });
}

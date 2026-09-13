import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { Link, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarPlus,
  Circle,
  CheckCircle2,
  Download,
  ExternalLink,
  KeyRound,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ApplicationDialog } from "@/components/application-dialog";
import {
  ContactsTab,
  DocumentsTab,
  ProcessTab,
} from "@/components/application-tabs";
import { ApplicationHeader } from "@/components/detail/application-header";
import { NextBestActionCard } from "@/components/detail/next-best-action";
import { OverviewTab } from "@/components/detail/overview-tab";
import { JobTab } from "@/components/detail/job-tab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyMark, EmptyState, Pill, SectionCard, StageBadge } from "@/components/ui-bits";
import {
  useApplication,
  useApplicationDocuments,
  useCalendar,
  useDeleteApplication,
  useDeleteEvent,
  useDeleteNote,
  useDeleteTask,
  useMoveStage,
  useNotes,
  useSaveEvent,
  useSaveNote,
  useSaveTask,
  useTasks,
  useTimeline,
} from "@/lib/api";
import { nextActionTone, nextBestAction } from "@/lib/next-action";
import { exportApplicationSummary } from "@/lib/export-pdf";
import { daysSinceApplied } from "@/lib/alerts";
import {
  EVENT_KIND_LABEL,
  EVENT_KIND_TONE,
  PIPELINE_STAGES,
  STAGES,
  STAGE_META,
  WORK_MODE_LABEL,
  formatSalary,
  type EventKind,
  type Stage,
} from "@/lib/domain";
import { fmtDate, fmtDateTime, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/applications/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de candidatura — NextRound" },
      {
        name: "description",
        content:
          "Todo el recorrido de una candidatura: siguiente paso, oferta guardada, proceso, documentos y notas.",
      },
      { property: "og:title", content: "Detalle de candidatura — NextRound" },
      {
        property: "og:description",
        content: "Sabe exactamente en qué punto estás y qué toca hacer ahora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const t = useT();
  const { id } = useParams({ from: "/_authenticated/applications/$id" });
  const navigate = useNavigate();
  const { data: app, isLoading } = useApplication(id);
  const { data: calendar = [] } = useCalendar();
  const { data: timeline = [] } = useTimeline(id);
  const { data: links = [] } = useApplicationDocuments(id);
  const { data: notes = [] } = useNotes();
  const moveStage = useMoveStage();
  const deleteApplication = useDeleteApplication();
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState("overview");

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />;
  }

  if (!app) {
    return (
      <EmptyState
        title={t("Candidatura no encontrada")}
        description={t("Puede que se haya eliminado.")}
        action={
          <Button asChild variant="outline">
            <Link to="/applications">{t("Volver a candidaturas")}</Link>
          </Button>
        }
      />
    );
  }

  const stageIndex = PIPELINE_STAGES.indexOf(app.stage);
  const progress = Math.round(((stageIndex + 1) / PIPELINE_STAGES.length) * 100);
  const days = daysSinceApplied(app);
  const action = nextBestAction(app, { events: calendar, timeline, links });
  const cvLink = links.find((link) => link.role === "cv" || link.documents?.kind === "cv");

  return (
    <div className="space-y-10 py-6">
      <ApplicationHeader
        app={app}
        days={days}
        onEdit={() => setEditOpen(true)}
        onExport={() =>
          exportApplicationSummary(app, {
            timeline,
            events: calendar.filter((event) => event.application_id === app.id),
            notes: notes
              .filter((note) => note.application_id === app.id)
              .map((note) => note.body ?? ""),
          })
        }
        onDelete={async () => {
          await deleteApplication.mutateAsync(app.id);
          toast.success(t("Candidatura eliminada"));
          navigate({ to: "/applications" });
        }}
      />

      <NextBestActionCard app={app} action={action} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="scrollbar-slim max-w-full overflow-x-auto">
          <TabsTrigger value="overview">{t("Resumen")}</TabsTrigger>
          <TabsTrigger value="job">{t("Oferta")}</TabsTrigger>
          <TabsTrigger value="process">{t("Proceso")}</TabsTrigger>
          <TabsTrigger value="documents">{t("Documentos")}</TabsTrigger>
          <TabsTrigger value="notes">{t("Notas")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-7 space-y-10">
          <OverviewTab application={app} />
          <ActivityFeed applicationId={app.id} />
        </TabsContent>

        <TabsContent value="job" className="mt-7">
          <JobTab application={app} />
        </TabsContent>

        <TabsContent value="process" className="mt-7 space-y-10">
          <ProcessTab application={app} />
          <EventsTab applicationId={app.id} />
          <TasksTab applicationId={app.id} />
          <ContactsTab application={app} />
        </TabsContent>

        <TabsContent value="documents" className="mt-7">
          <DocumentsTab application={app} />
        </TabsContent>

        <TabsContent value="notes" className="mt-7">
          <NotesTab applicationId={app.id} />
        </TabsContent>
      </Tabs>

      <ApplicationDialog open={editOpen} onOpenChange={setEditOpen} application={app} />
    </div>
  );
}




function NotesTab({ applicationId }: { applicationId: string }) {
  const t = useT();
  const { data: notes = [] } = useNotes();
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();
  const [body, setBody] = useState("");
  const mine = notes.filter((note) => note.application_id === applicationId);

  return (
    <div className="space-y-5">
      <SectionCard title={t("Nueva nota")}>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder={t("Preguntas para la próxima entrevista, feedback recibido…")}
        />
        <Button
          className="mt-3 gap-1.5"
          onClick={async () => {
            if (!body.trim()) return;
            await saveNote.mutateAsync({
              values: { application_id: applicationId, body: body.trim() },
            });
            setBody("");
            toast.success(t("Nota guardada"));
          }}
        >
          <Plus className="size-4" /> {t("Guardar nota")}
        </Button>
      </SectionCard>

      {mine.length === 0 ? (
        <EmptyState title={t("Sin notas")} description={t("Todo lo que apuntes aparecerá aquí.")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mine.map((note) => (
            <SectionCard key={note.id} title={note.title ?? t("Nota")}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.body}</p>
              <button
                onClick={() => deleteNote.mutate(note.id)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-danger"
              >
                <Trash2 className="size-3.5" /> {t("Eliminar")}
              </button>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksTab({ applicationId }: { applicationId: string }) {
  const t = useT();
  const { data: tasks = [] } = useTasks();
  const saveTask = useSaveTask();
  const deleteTask = useDeleteTask();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const mine = tasks.filter((task) => task.application_id === applicationId);

  return (
    <div className="space-y-5">
      <SectionCard title={t("Nueva tarea")}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("Preparar caso práctico")}
          />
          <Input
            type="date"
            value={due}
            onChange={(event) => setDue(event.target.value)}
            className="sm:w-44"
          />
          <Button
            className="gap-1.5"
            onClick={async () => {
              if (!title.trim()) return;
              await saveTask.mutateAsync({
                values: {
                  application_id: applicationId,
                  title: title.trim(),
                  due_date: due || null,
                },
              });
              setTitle("");
              setDue("");
            }}
          >
            <Plus className="size-4" /> {t("Añadir")}
          </Button>
        </div>
      </SectionCard>

      {mine.length === 0 ? (
        <EmptyState title={t("Sin tareas")} description={t("Divide la preparación en pasos concretos.")} />
      ) : (
        <SectionCard bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {mine.map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-5 py-3">
                <button
                  onClick={() => saveTask.mutate({ id: task.id, values: { done: !task.done } })}
                  aria-label={t("Cambiar estado")}
                  className={task.done ? "text-success" : "text-muted-foreground"}
                >
                  {task.done ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </button>
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    task.done ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {task.title}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {relativeDay(task.due_date)}
                </span>
                <button
                  onClick={() => deleteTask.mutate(task.id)}
                  aria-label={t("Eliminar tarea")}
                  className="text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

function EventsTab({ applicationId }: { applicationId: string }) {
  const t = useT();
  const { data: events = [] } = useCalendar();
  const saveEvent = useSaveEvent();
  const deleteEvent = useDeleteEvent();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("interview");
  const [startsAt, setStartsAt] = useState("");
  const mine = events.filter((event) => event.application_id === applicationId);

  return (
    <div className="space-y-5">
      <SectionCard title={t("Agendar")}>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("Entrevista con hiring manager")}
            className="sm:col-span-2"
          />
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as EventKind)}
            className="h-10 rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {(Object.keys(EVENT_KIND_LABEL) as EventKind[]).map((value) => (
              <option key={value} value={value}>
                {t(EVENT_KIND_LABEL[value])}
              </option>
            ))}
          </select>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </div>
        <Button
          className="mt-3 gap-1.5"
          onClick={async () => {
            if (!title.trim() || !startsAt) {
              toast.error(t("Añade título y fecha."));
              return;
            }
            await saveEvent.mutateAsync({
              values: {
                application_id: applicationId,
                title: title.trim(),
                kind,
                starts_at: new Date(startsAt).toISOString(),
              },
            });
            setTitle("");
            setStartsAt("");
            toast.success(t("Evento agendado"));
          }}
        >
          <CalendarPlus className="size-4" /> {t("Agendar")}
        </Button>
      </SectionCard>

      {mine.length === 0 ? (
        <EmptyState title={t("Sin entrevistas")} description={t("Agenda la próxima cita del proceso.")} />
      ) : (
        <SectionCard bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {mine.map((event) => (
              <li key={event.id} className="flex items-center gap-4 px-5 py-3.5">
                <Pill tone={EVENT_KIND_TONE[event.kind]}>{t(EVENT_KIND_LABEL[event.kind])}</Pill>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(event.starts_at)}</p>
                </div>
                <button
                  onClick={() => deleteEvent.mutate(event.id)}
                  aria-label={t("Eliminar evento")}
                  className="text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

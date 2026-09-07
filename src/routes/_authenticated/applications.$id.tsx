import { useState } from "react";
import { Link, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarPlus,
  Circle,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ApplicationDialog } from "@/components/application-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyMark, EmptyState, Pill, SectionCard, StageBadge } from "@/components/ui-bits";
import {
  useAddTimelineEvent,
  useApplication,
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
import {
  EVENT_KIND_LABEL,
  EVENT_KIND_TONE,
  PIPELINE_STAGES,
  PRIORITY_LABEL,
  STAGES,
  STAGE_META,
  WORK_MODE_LABEL,
  formatSalary,
  priorityTone,
  type EventKind,
  type Stage,
} from "@/lib/domain";
import { fmtDate, fmtDateTime, relativeDay } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/applications/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de candidatura — NextRound" },
      {
        name: "description",
        content:
          "Etapas, historial, notas, tareas y entrevistas de una candidatura concreta en NextRound.",
      },
      { property: "og:title", content: "Detalle de candidatura — NextRound" },
      {
        property: "og:description",
        content: "Todo el recorrido de una candidatura: etapas, historial, notas y entrevistas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { id } = useParams({ from: "/_authenticated/applications/$id" });
  const navigate = useNavigate();
  const { data: app, isLoading } = useApplication(id);
  const moveStage = useMoveStage();
  const deleteApplication = useDeleteApplication();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />;
  }

  if (!app) {
    return (
      <EmptyState
        title="Candidatura no encontrada"
        description="Puede que se haya eliminado."
        action={
          <Button asChild variant="outline">
            <Link to="/applications">Volver a candidaturas</Link>
          </Button>
        }
      />
    );
  }

  const stageIndex = PIPELINE_STAGES.indexOf(app.stage);

  return (
    <div className="space-y-6">
      <Link
        to="/applications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Candidaturas
      </Link>

      <header className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-soft md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <CompanyMark name={app.companies?.name ?? app.role_title} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{app.role_title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {app.companies?.name ?? "Sin empresa"}
              {app.location ? ` · ${app.location}` : ""}
              {app.work_mode ? ` · ${WORK_MODE_LABEL[app.work_mode]}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StageBadge stage={app.stage} />
              <Pill tone={priorityTone(app.priority ?? "medium")}>
                Prioridad {PRIORITY_LABEL[app.priority ?? "medium"]}
              </Pill>
              <Pill>{formatSalary(app.salary_min, app.salary_max, app.currency ?? "EUR")}</Pill>
              <Pill>Interés {app.excitement ?? 3}/5</Pill>
              {app.source && <Pill>{app.source}</Pill>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={app.stage}
            onChange={(event) =>
              moveStage.mutate({ application: app, to: event.target.value as Stage })
            }
            aria-label="Cambiar etapa"
            className="h-9 rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_META[stage].label}
              </option>
            ))}
          </select>
          {app.job_url && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={app.job_url} target="_blank" rel="noreferrer">
                Oferta <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-danger hover:text-danger"
            onClick={async () => {
              await deleteApplication.mutateAsync(app.id);
              toast.success("Candidatura eliminada");
              navigate({ to: "/applications" });
            }}
          >
            <Trash2 className="size-3.5" /> Eliminar
          </Button>
        </div>
      </header>

      <div className="scrollbar-slim flex items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-surface px-4 py-3">
        {PIPELINE_STAGES.map((stage, index) => {
          const reached = stageIndex >= index;
          return (
            <div key={stage} className="flex items-center gap-1">
              <button
                onClick={() => moveStage.mutate({ application: app, to: stage })}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  reached
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted-foreground hover:bg-accent"
                }`}
              >
                {STAGE_META[stage].short}
              </button>
              {index < PIPELINE_STAGES.length - 1 && (
                <span
                  className={`h-px w-5 ${stageIndex > index ? "bg-primary" : "bg-border"}`}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="events">Entrevistas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <SectionCard title="Detalles" className="lg:col-span-2">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Enviada el" value={fmtDate(app.applied_at)} />
                <Detail label="Origen" value={app.source ?? "—"} />
                <Detail label="Ubicación" value={app.location ?? "—"} />
                <Detail
                  label="Modalidad"
                  value={app.work_mode ? WORK_MODE_LABEL[app.work_mode] : "—"}
                />
                <Detail
                  label="Rango salarial"
                  value={formatSalary(app.salary_min, app.salary_max, app.currency ?? "EUR")}
                />
                <Detail
                  label="Próxima acción"
                  value={
                    app.next_action
                      ? `${app.next_action} · ${relativeDay(app.next_action_at)}`
                      : "Sin definir"
                  }
                />
              </dl>
              {app.description && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Descripción
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {app.description}
                  </p>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Empresa">
              {app.companies ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CompanyMark name={app.companies.name} />
                    <div>
                      <p className="text-sm font-medium">{app.companies.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.companies.industry ?? "Sector sin definir"}
                      </p>
                    </div>
                  </div>
                  {app.companies.location && (
                    <p className="text-sm text-muted-foreground">{app.companies.location}</p>
                  )}
                  {app.companies.website && (
                    <a
                      href={app.companies.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      Web <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/companies">Ver empresas</Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Esta candidatura no tiene empresa asociada.
                </p>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <ActivityTab application={app} />
        </TabsContent>
        <TabsContent value="notes" className="mt-5">
          <NotesTab applicationId={app.id} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-5">
          <TasksTab applicationId={app.id} />
        </TabsContent>
        <TabsContent value="events" className="mt-5">
          <EventsTab applicationId={app.id} />
        </TabsContent>
      </Tabs>

      <ApplicationDialog open={editOpen} onOpenChange={setEditOpen} application={app} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

function ActivityTab({ application }: { application: ApplicationWithCompany }) {
  const { data: timeline = [] } = useTimeline(application.id);
  const addEvent = useAddTimelineEvent();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <SectionCard title="Historial" className="lg:col-span-2" bodyClassName="p-0">
        {timeline.length === 0 ? (
          <div className="px-5 py-8">
            <EmptyState title="Sin actividad" description="Registra el primer paso del proceso." />
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {timeline.map((event) => (
              <li key={event.id} className="flex gap-4 px-5 py-4">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.detail && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{event.detail}</p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {fmtDateTime(event.occurred_at)}
                    {event.from_stage && event.to_stage
                      ? ` · ${STAGE_META[event.from_stage].label} → ${STAGE_META[event.to_stage].label}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <SectionCard title="Añadir entrada">
        <div className="space-y-3">
          <div>
            <Label htmlFor="ev-title">Qué ha pasado</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Llamada con recruiter"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="ev-detail">Detalle</Label>
            <Textarea
              id="ev-detail"
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              rows={3}
              className="mt-1.5"
            />
          </div>
          <Button
            className="w-full gap-1.5"
            onClick={async () => {
              if (!title.trim()) return;
              await addEvent.mutateAsync({ application, title: title.trim(), detail });
              setTitle("");
              setDetail("");
              toast.success("Entrada añadida");
            }}
          >
            <Plus className="size-4" /> Añadir
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function NotesTab({ applicationId }: { applicationId: string }) {
  const { data: notes = [] } = useNotes();
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();
  const [body, setBody] = useState("");
  const mine = notes.filter((note) => note.application_id === applicationId);

  return (
    <div className="space-y-5">
      <SectionCard title="Nueva nota">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="Preguntas para la próxima entrevista, feedback recibido…"
        />
        <Button
          className="mt-3 gap-1.5"
          onClick={async () => {
            if (!body.trim()) return;
            await saveNote.mutateAsync({
              values: { application_id: applicationId, body: body.trim() },
            });
            setBody("");
            toast.success("Nota guardada");
          }}
        >
          <Plus className="size-4" /> Guardar nota
        </Button>
      </SectionCard>

      {mine.length === 0 ? (
        <EmptyState title="Sin notas" description="Todo lo que apuntes aparecerá aquí." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mine.map((note) => (
            <SectionCard key={note.id} title={note.title ?? "Nota"}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.body}</p>
              <button
                onClick={() => deleteNote.mutate(note.id)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-danger"
              >
                <Trash2 className="size-3.5" /> Eliminar
              </button>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksTab({ applicationId }: { applicationId: string }) {
  const { data: tasks = [] } = useTasks();
  const saveTask = useSaveTask();
  const deleteTask = useDeleteTask();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const mine = tasks.filter((task) => task.application_id === applicationId);

  return (
    <div className="space-y-5">
      <SectionCard title="Nueva tarea">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Preparar caso práctico"
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
            <Plus className="size-4" /> Añadir
          </Button>
        </div>
      </SectionCard>

      {mine.length === 0 ? (
        <EmptyState title="Sin tareas" description="Divide la preparación en pasos concretos." />
      ) : (
        <SectionCard bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {mine.map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-5 py-3">
                <button
                  onClick={() => saveTask.mutate({ id: task.id, values: { done: !task.done } })}
                  aria-label="Cambiar estado"
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
                  aria-label="Eliminar tarea"
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
  const { data: events = [] } = useCalendar();
  const saveEvent = useSaveEvent();
  const deleteEvent = useDeleteEvent();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("interview");
  const [startsAt, setStartsAt] = useState("");
  const mine = events.filter((event) => event.application_id === applicationId);

  return (
    <div className="space-y-5">
      <SectionCard title="Agendar">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Entrevista con hiring manager"
            className="sm:col-span-2"
          />
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as EventKind)}
            className="h-10 rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {(Object.keys(EVENT_KIND_LABEL) as EventKind[]).map((value) => (
              <option key={value} value={value}>
                {EVENT_KIND_LABEL[value]}
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
              toast.error("Añade título y fecha.");
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
            toast.success("Evento agendado");
          }}
        >
          <CalendarPlus className="size-4" /> Agendar
        </Button>
      </SectionCard>

      {mine.length === 0 ? (
        <EmptyState title="Sin entrevistas" description="Agenda la próxima cita del proceso." />
      ) : (
        <SectionCard bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {mine.map((event) => (
              <li key={event.id} className="flex items-center gap-4 px-5 py-3.5">
                <Pill tone={EVENT_KIND_TONE[event.kind]}>{EVENT_KIND_LABEL[event.kind]}</Pill>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(event.starts_at)}</p>
                </div>
                <button
                  onClick={() => deleteEvent.mutate(event.id)}
                  aria-label="Eliminar evento"
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

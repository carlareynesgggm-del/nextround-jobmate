import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CheckSquare, Circle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, Pill, SectionCard } from "@/components/ui-bits";
import { useApplications, useDeleteTask, useSaveTask, useTasks } from "@/lib/api";
import { PRIORITY_LABEL, priorityTone, type TaskRow } from "@/lib/domain";
import { daysFromToday, relativeDay } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tareas — NextRound" },
      {
        name: "description",
        content:
          "Lista de tareas de tu búsqueda de empleo agrupadas por vencimiento: hoy, esta semana y más adelante.",
      },
      { property: "og:title", content: "Tareas — NextRound" },
      {
        property: "og:description",
        content: "Organiza la preparación de cada proceso en tareas con fecha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { data: tasks = [] } = useTasks();
  const { data: applications = [] } = useApplications();
  const saveTask = useSaveTask();
  const deleteTask = useDeleteTask();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [priority, setPriority] = useState("medium");

  const open = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);

  const groups: { label: string; items: TaskRow[] }[] = [
    {
      label: "Vencidas",
      items: open.filter((task) => (daysFromToday(task.due_date) ?? 99) < 0),
    },
    { label: "Hoy", items: open.filter((task) => daysFromToday(task.due_date) === 0) },
    {
      label: "Próximos 7 días",
      items: open.filter((task) => {
        const diff = daysFromToday(task.due_date);
        return diff !== null && diff > 0 && diff <= 7;
      }),
    },
    {
      label: "Más adelante",
      items: open.filter((task) => {
        const diff = daysFromToday(task.due_date);
        return diff === null || diff > 7;
      }),
    },
  ];

  function row(task: TaskRow) {
    const app = applications.find((item) => item.id === task.application_id);
    return (
      <li key={task.id} className="flex items-center gap-3 px-5 py-3">
        <button
          onClick={() => saveTask.mutate({ id: task.id, values: { done: !task.done } })}
          aria-label="Cambiar estado"
          className={task.done ? "text-success" : "text-muted-foreground hover:text-success"}
        >
          {task.done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm ${task.done ? "text-muted-foreground line-through" : ""}`}>
            {task.title}
          </p>
          {app && (
            <p className="truncate text-xs text-muted-foreground">
              {app.companies?.name ?? "Sin empresa"} · {app.role_title}
            </p>
          )}
        </div>
        <Pill tone={priorityTone(task.priority ?? "medium")}>
          {PRIORITY_LABEL[task.priority ?? "medium"]}
        </Pill>
        <span className="w-24 text-right text-[11px] text-muted-foreground">
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
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas"
        description={`${open.length} pendientes · ${done.length} completadas.`}
      />

      <SectionCard title="Añadir tarea">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Preparar preguntas para la entrevista"
          />
          <select
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
            className="h-10 rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Candidatura"
          >
            <option value="">Sin candidatura</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.companies?.name ?? "Sin empresa"} · {app.role_title}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="h-10 rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Prioridad"
          >
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
          <Input
            type="date"
            value={due}
            onChange={(event) => setDue(event.target.value)}
            className="md:w-40"
          />
        </div>
        <Button
          className="mt-3 gap-1.5"
          onClick={() => {
            if (!title.trim()) return;
            saveTask.mutate({
              values: {
                title: title.trim(),
                due_date: due || null,
                priority,
                application_id: applicationId || null,
              },
            });
            setTitle("");
            setDue("");
          }}
        >
          <Plus className="size-4" /> Añadir tarea
        </Button>
      </SectionCard>

      {open.length === 0 ? (
        <EmptyState
          title="Sin tareas pendientes"
          description="Añade lo siguiente que quieras preparar."
          icon={<CheckSquare className="size-6" />}
        />
      ) : (
        <div className="space-y-5">
          {groups
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <SectionCard
                key={group.label}
                title={group.label}
                subtitle={`${group.items.length} tareas`}
                bodyClassName="p-0"
              >
                <ul className="divide-y divide-border">{group.items.map(row)}</ul>
              </SectionCard>
            ))}
        </div>
      )}

      {done.length > 0 && (
        <SectionCard title="Completadas" subtitle={`${done.length} tareas`} bodyClassName="p-0">
          <ul className="divide-y divide-border">{done.slice(0, 12).map(row)}</ul>
        </SectionCard>
      )}
    </div>
  );
}

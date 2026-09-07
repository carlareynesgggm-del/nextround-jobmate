import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Circle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { EmptyState, KpiCard, PageHeader, SectionCard, StageBadge, CompanyMark, Pill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useApplications, useCalendar, useSaveTask, useTasks } from "@/lib/api";
import { PIPELINE_STAGES, STAGE_META, isActive } from "@/lib/domain";
import { daysFromToday, fmtDateTime, relativeDay } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Panel — NextRound" },
      {
        name: "description",
        content:
          "Vista general de tu búsqueda: candidaturas activas, próximas entrevistas, tareas y objetivos de la semana.",
      },
      { property: "og:title", content: "Panel — NextRound" },
      {
        property: "og:description",
        content: "Candidaturas activas, entrevistas de la semana y tus próximas acciones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: applications = [], isLoading } = useApplications();
  const { data: events = [] } = useCalendar();
  const { data: tasks = [] } = useTasks();
  const saveTask = useSaveTask();

  const active = applications.filter((app) => isActive(app.stage) && !app.archived);
  const responded = applications.filter(
    (app) => !["saved", "applied"].includes(app.stage),
  ).length;
  const sent = applications.filter((app) => app.stage !== "saved").length;
  const responseRate = sent ? Math.round((responded / sent) * 100) : 0;
  const offers = applications.filter((app) => app.stage === "offer").length;

  const upcoming = events
    .filter((event) => new Date(event.starts_at).getTime() >= Date.now() - 3_600_000)
    .slice(0, 5);
  const interviewsThisWeek = events.filter((event) => {
    const diff = daysFromToday(event.starts_at);
    return diff !== null && diff >= 0 && diff <= 7;
  }).length;

  const openTasks = tasks.filter((task) => !task.done).slice(0, 6);
  const nextActions = active
    .filter((app) => app.next_action)
    .sort((a, b) => (a.next_action_at ?? "9999").localeCompare(b.next_action_at ?? "9999"))
    .slice(0, 5);

  const counts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: applications.filter((app) => app.stage === stage).length,
  }));
  const maxCount = Math.max(1, ...counts.map((entry) => entry.count));

  return (
    <div className="space-y-7">
      <PageHeader
        title="Tu panel"
        description="Todo lo que necesita atención hoy, en un solo sitio."
        actions={
          <Button asChild variant="outline">
            <Link to="/applications">Ver candidaturas</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Activas"
          value={isLoading ? "—" : active.length}
          hint="procesos en marcha"
          icon={<Briefcase className="size-4" />}
        />
        <KpiCard
          label="Entrevistas 7 días"
          value={interviewsThisWeek}
          hint="en tu calendario"
          icon={<CalendarClock className="size-4" />}
        />
        <KpiCard
          label="Tasa de respuesta"
          value={`${responseRate}%`}
          hint={`${responded} de ${sent} enviadas`}
          icon={<TrendingUp className="size-4" />}
        />
        <KpiCard
          label="Ofertas"
          value={offers}
          hint="pendientes de decisión"
          icon={<Sparkles className="size-4" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard
          title="Próximas citas"
          subtitle="Entrevistas, pruebas y deadlines"
          className="lg:col-span-2"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/calendar">Calendario</Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {upcoming.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="Sin citas próximas"
                description="Cuando agendes una entrevista aparecerá aquí."
                icon={<CalendarClock className="size-6" />}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((event) => (
                <li key={event.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-semibold">{relativeDay(event.starts_at)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {fmtDateTime(event.starts_at)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    {event.location && (
                      <p className="truncate text-xs text-muted-foreground">{event.location}</p>
                    )}
                  </div>
                  <Pill>{event.duration_min ?? 30} min</Pill>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Pipeline" subtitle="Distribución por etapa">
          <ul className="space-y-3">
            {counts.map(({ stage, count }) => (
              <li key={stage}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{STAGE_META[stage].label}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${STAGE_META[stage].dot}`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Próximas acciones"
          subtitle="Lo que has apuntado en cada candidatura"
          bodyClassName="p-0"
        >
          {nextActions.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="Nada pendiente"
                description="Añade una próxima acción en tus candidaturas activas."
                icon={<Target className="size-6" />}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {nextActions.map((app) => (
                <li key={app.id}>
                  <Link
                    to="/applications/$id"
                    params={{ id: app.id }}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/50"
                  >
                    <CompanyMark name={app.companies?.name ?? app.role_title} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{app.next_action}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {app.companies?.name ?? "Sin empresa"} · {app.role_title}
                      </p>
                    </div>
                    <div className="text-right">
                      <StageBadge stage={app.stage} />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {relativeDay(app.next_action_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Tareas abiertas"
          subtitle="Marca lo que ya hayas hecho"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/tasks">Ver todas</Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {openTasks.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="Todo hecho"
                description="No tienes tareas pendientes ahora mismo."
                icon={<CheckCircle2 className="size-6" />}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {openTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={() => saveTask.mutate({ id: task.id, values: { done: true } })}
                    aria-label="Marcar como hecha"
                    className="text-muted-foreground transition-colors hover:text-success"
                  >
                    <Circle className="size-4" />
                  </button>
                  <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {relativeDay(task.due_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

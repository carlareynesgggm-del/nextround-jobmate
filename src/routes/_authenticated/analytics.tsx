import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Percent, Timer, Trophy } from "lucide-react";

import { EmptyState, KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { useApplications, useCalendar } from "@/lib/api";
import {
  CLOSED_STAGES,
  PIPELINE_STAGES,
  STAGE_META,
  WORK_MODE_LABEL,
  type WorkMode,
} from "@/lib/domain";
import { daysFromToday } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — NextRound" },
      {
        name: "description",
        content:
          "Métricas de tu búsqueda: conversión por etapa, tasa de respuesta, actividad semanal y origen de las candidaturas.",
      },
      { property: "og:title", content: "Analytics — NextRound" },
      {
        property: "og:description",
        content: "Conversión por etapa, tasa de respuesta y actividad semanal de tu búsqueda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: applications = [] } = useApplications();
  const { data: events = [] } = useCalendar();

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Métricas de tu búsqueda de empleo." />
        <EmptyState
          title="Aún no hay datos"
          description="Registra candidaturas para ver tus métricas de conversión."
          icon={<BarChart3 className="size-6" />}
        />
      </div>
    );
  }

  const sent = applications.filter((app) => app.stage !== "saved").length;
  const responded = applications.filter(
    (app) => !["saved", "applied"].includes(app.stage),
  ).length;
  const interviews = applications.filter((app) =>
    ["interview", "technical", "final", "offer"].includes(app.stage),
  ).length;
  const offers = applications.filter((app) => app.stage === "offer").length;
  const rejected = applications.filter((app) => app.stage === "rejected").length;
  const closed = applications.filter((app) => CLOSED_STAGES.includes(app.stage)).length;

  const responseRate = sent ? Math.round((responded / sent) * 100) : 0;
  const interviewRate = sent ? Math.round((interviews / sent) * 100) : 0;
  const offerRate = sent ? Math.round((offers / sent) * 100) : 0;

  const funnel = [
    { label: "Enviadas", count: sent },
    { label: "Con respuesta", count: responded },
    { label: "En entrevistas", count: interviews },
    { label: "Ofertas", count: offers },
  ];

  const byStage = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: applications.filter((app) => app.stage === stage).length,
  }));
  const maxStage = Math.max(1, ...byStage.map((entry) => entry.count));

  const sources = Object.entries(
    applications.reduce<Record<string, number>>((acc, app) => {
      const key = app.source?.trim() || "Sin origen";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(1, ...sources.map(([, count]) => count));

  const modes = (Object.keys(WORK_MODE_LABEL) as WorkMode[]).map((mode) => ({
    mode,
    count: applications.filter((app) => app.work_mode === mode).length,
  }));

  const weekly = Array.from({ length: 6 }, (_, index) => {
    const weeksAgo = 5 - index;
    const count = applications.filter((app) => {
      const diff = daysFromToday(app.applied_at);
      if (diff === null) return false;
      const weeks = Math.floor(Math.abs(diff) / 7);
      return diff <= 0 && weeks === weeksAgo;
    }).length;
    return { label: weeksAgo === 0 ? "Esta sem." : `-${weeksAgo}`, count };
  });
  const maxWeekly = Math.max(1, ...weekly.map((entry) => entry.count));

  const upcomingInterviews = events.filter((event) => {
    const diff = daysFromToday(event.starts_at);
    return event.kind === "interview" && diff !== null && diff >= 0;
  }).length;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Analytics"
        description="Qué está funcionando y dónde se atascan tus procesos."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Tasa de respuesta"
          value={`${responseRate}%`}
          hint={`${responded} de ${sent}`}
          icon={<Percent className="size-4" />}
        />
        <KpiCard
          label="Llegan a entrevista"
          value={`${interviewRate}%`}
          hint={`${interviews} procesos`}
          icon={<Timer className="size-4" />}
        />
        <KpiCard
          label="Ofertas"
          value={`${offerRate}%`}
          hint={`${offers} ofertas`}
          icon={<Trophy className="size-4" />}
        />
        <KpiCard
          label="Cerradas"
          value={closed}
          hint={`${rejected} rechazos`}
          icon={<BarChart3 className="size-4" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Embudo" subtitle="De candidatura enviada a oferta">
          <ul className="space-y-4">
            {funnel.map((step) => (
              <li key={step.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{step.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {step.count}
                    {sent ? ` · ${Math.round((step.count / Math.max(sent, 1)) * 100)}%` : ""}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(step.count / Math.max(sent, 1)) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Actividad" subtitle="Candidaturas enviadas por semana">
          <div className="flex h-44 items-end gap-3">
            {weekly.map((entry) => (
              <div key={entry.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gold/70"
                    style={{ height: `${(entry.count / maxWeekly) * 100}%`, minHeight: "4px" }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {entry.count}
                </span>
                <span className="text-[11px] text-muted-foreground">{entry.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Por etapa" subtitle="Dónde está tu pipeline">
          <ul className="space-y-3">
            {byStage.map(({ stage, count }) => (
              <li key={stage}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{STAGE_META[stage].label}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${STAGE_META[stage].dot}`}
                    style={{ width: `${(count / maxStage) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Origen y modalidad" subtitle="De dónde salen tus oportunidades">
          <ul className="space-y-3">
            {sources.slice(0, 5).map(([source, count]) => (
              <li key={source}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{source}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-violet"
                    style={{ width: `${(count / maxSource) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
            {modes.map(({ mode, count }) => (
              <div key={mode} className="rounded-xl bg-surface-2 px-3 py-2.5 text-center">
                <p className="font-display text-lg font-semibold tabular-nums">{count}</p>
                <p className="text-[11px] text-muted-foreground">{WORK_MODE_LABEL[mode]}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {upcomingInterviews} entrevistas confirmadas por delante.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

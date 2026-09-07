import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Briefcase, LayoutGrid, List, Plus, Search } from "lucide-react";

import { ApplicationDialog } from "@/components/application-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyMark, EmptyState, PageHeader, Pill, SectionCard, StageBadge } from "@/components/ui-bits";
import { useApplications, useMoveStage } from "@/lib/api";
import {
  PIPELINE_STAGES,
  PRIORITY_LABEL,
  STAGES,
  STAGE_META,
  WORK_MODE_LABEL,
  formatSalary,
  priorityTone,
  type ApplicationWithCompany,
  type Stage,
} from "@/lib/domain";
import { fmtDate, relativeDay } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/applications/")({
  head: () => ({
    meta: [
      { title: "Candidaturas — NextRound" },
      {
        name: "description",
        content:
          "Pipeline completo de candidaturas: filtra por etapa, prioridad y empresa, y mueve cada proceso de fase.",
      },
      { property: "og:title", content: "Candidaturas — NextRound" },
      {
        property: "og:description",
        content: "Tu pipeline de candidaturas con etapas, prioridades y próximas acciones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { data: applications = [], isLoading } = useApplications();
  const moveStage = useMoveStage();
  const [view, setView] = useState<"board" | "list">("board");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return applications.filter((app) => {
      if (app.archived) return false;
      if (stageFilter !== "all" && app.stage !== stageFilter) return false;
      if (!term) return true;
      return (
        app.role_title.toLowerCase().includes(term) ||
        (app.companies?.name ?? "").toLowerCase().includes(term) ||
        (app.location ?? "").toLowerCase().includes(term)
      );
    });
  }, [applications, query, stageFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidaturas"
        description={`${filtered.length} procesos visibles de ${applications.length} registrados.`}
        actions={
          <>
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              <button
                onClick={() => setView("board")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  view === "board" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
                }`}
              >
                <LayoutGrid className="size-3.5" /> Tablero
              </button>
              <button
                onClick={() => setView("list")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  view === "list" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
                }`}
              >
                <List className="size-3.5" /> Lista
              </button>
            </div>
            <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" /> Nueva
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por puesto, empresa o ciudad…"
            className="pl-9"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(event) => setStageFilter(event.target.value as Stage | "all")}
          className="h-10 rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <option value="all">Todas las etapas</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_META[stage].label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin candidaturas"
          description="Crea la primera y empieza a seguir su recorrido."
          icon={<Briefcase className="size-6" />}
          action={
            <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" /> Nueva candidatura
            </Button>
          }
        />
      ) : view === "board" ? (
        <div className="scrollbar-slim -mx-1 flex gap-4 overflow-x-auto px-1 pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const items = filtered.filter((app) => app.stage === stage);
            return (
              <div key={stage} className="w-[280px] shrink-0">
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <StageBadge stage={stage} />
                  <span className="text-xs tabular-nums text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2.5 rounded-2xl bg-surface-2/60 p-2.5">
                  {items.length === 0 && (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                      Nada en esta etapa
                    </p>
                  )}
                  {items.map((app) => (
                    <BoardCard
                      key={app.id}
                      app={app}
                      onMove={(to) => moveStage.mutate({ application: app, to })}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <SectionCard bodyClassName="p-0">
          <div className="scrollbar-slim overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Puesto</th>
                  <th className="px-5 py-3 font-medium">Etapa</th>
                  <th className="px-5 py-3 font-medium">Ubicación</th>
                  <th className="px-5 py-3 font-medium">Salario</th>
                  <th className="px-5 py-3 font-medium">Enviada</th>
                  <th className="px-5 py-3 font-medium">Próxima acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((app) => (
                  <tr key={app.id} className="transition-colors hover:bg-accent/40">
                    <td className="px-5 py-3">
                      <Link
                        to="/applications/$id"
                        params={{ id: app.id }}
                        className="flex items-center gap-3"
                      >
                        <CompanyMark name={app.companies?.name ?? app.role_title} size="sm" />
                        <span>
                          <span className="block font-medium">{app.role_title}</span>
                          <span className="block text-xs text-muted-foreground">
                            {app.companies?.name ?? "Sin empresa"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <StageBadge stage={app.stage} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {app.location ?? "—"}
                      {app.work_mode && (
                        <span className="ml-1.5 text-xs">· {WORK_MODE_LABEL[app.work_mode]}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatSalary(app.salary_min, app.salary_max, app.currency ?? "EUR")}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {fmtDate(app.applied_at)}
                      {daysSinceApplied(app) !== null && (
                        <span className="block text-xs">{daysSinceApplied(app)} días</span>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      {app.next_action ? (
                        <span>
                          <span className="block">{app.next_action}</span>
                          <span className="block text-xs text-muted-foreground">
                            {relativeDay(app.next_action_at)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <ApplicationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function BoardCard({
  app,
  onMove,
}: {
  app: ApplicationWithCompany;
  onMove: (to: Stage) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface p-3 shadow-soft transition-shadow hover:shadow-lift">
      <Link to="/applications/$id" params={{ id: app.id }} className="block">
        <div className="flex items-start gap-2.5">
          <CompanyMark name={app.companies?.name ?? app.role_title} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">{app.role_title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {app.companies?.name ?? "Sin empresa"}
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {app.location && <Pill>{app.location}</Pill>}
          {app.work_mode && <Pill>{WORK_MODE_LABEL[app.work_mode]}</Pill>}
          <Pill tone={priorityTone(app.priority ?? "medium")}>
            {PRIORITY_LABEL[app.priority ?? "medium"]}
          </Pill>
        </div>
        {app.next_action && (
          <p className="mt-2.5 truncate text-xs text-muted-foreground">
            → {app.next_action} · {relativeDay(app.next_action_at)}
          </p>
        )}
      </Link>
      <select
        value={app.stage}
        onChange={(event) => onMove(event.target.value as Stage)}
        aria-label="Mover de etapa"
        className="mt-3 h-8 w-full rounded-lg border border-input bg-surface-2 px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {STAGE_META[stage].label}
          </option>
        ))}
      </select>
    </article>
  );
}

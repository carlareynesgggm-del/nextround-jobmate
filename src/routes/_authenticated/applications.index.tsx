import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Briefcase, LayoutGrid, Plus, Table as TableIcon } from "lucide-react";

import { ApplicationDialog } from "@/components/application-dialog";
import { AppsFilters } from "@/components/applications/apps-filters";
import { AppsKanban } from "@/components/applications/apps-kanban";
import { AppsTable } from "@/components/applications/apps-table";
import type { AppsSearch, SortKey } from "@/components/applications/types";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui-bits";
import { useAllApplicationDocuments, useApplications, useCalendar } from "@/lib/api";
import {
  CLOSED_STAGES,
  matchesQuickFilter,
  type ApplicationWithCompany,
  type QuickFilter,
} from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/applications/")({
  validateSearch: (search: Record<string, unknown>): AppsSearch => ({
    view: search.view === "kanban" ? "kanban" : "table",
    q: typeof search.q === "string" ? search.q : undefined,
    quick: typeof search.quick === "string" ? (search.quick as QuickFilter) : undefined,
    sort: typeof search.sort === "string" ? (search.sort as SortKey) : undefined,
    stage: typeof search.stage === "string" ? (search.stage as AppsSearch["stage"]) : undefined,
    company: typeof search.company === "string" ? search.company : undefined,
    location: typeof search.location === "string" ? search.location : undefined,
    country: typeof search.country === "string" ? search.country : undefined,
    industry: typeof search.industry === "string" ? search.industry : undefined,
    type: typeof search.type === "string" ? search.type : undefined,
    mode: typeof search.mode === "string" ? (search.mode as AppsSearch["mode"]) : undefined,
    cv: typeof search.cv === "string" ? search.cv : undefined,
    source: typeof search.source === "string" ? search.source : undefined,
    priority: typeof search.priority === "string" ? search.priority : undefined,
    appliedFrom: typeof search.appliedFrom === "string" ? search.appliedFrom : undefined,
    appliedTo: typeof search.appliedTo === "string" ? search.appliedTo : undefined,
    deadlineFrom: typeof search.deadlineFrom === "string" ? search.deadlineFrom : undefined,
    deadlineTo: typeof search.deadlineTo === "string" ? search.deadlineTo : undefined,
  }),
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

function daysWaiting(app: ApplicationWithCompany): number {
  if (!app.applied_at) return -1;
  const date = new Date(app.applied_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - date.getTime()) / 86_400_000));
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

function ApplicationsPage() {
  const t = useT();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: applications = [], isLoading } = useApplications();
  const { data: documents = [] } = useAllApplicationDocuments();
  const { data: events = [] } = useCalendar();
  const [dialogOpen, setDialogOpen] = useState(false);

  const patchSearch = (patch: Partial<AppsSearch>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  };

  const active = useMemo(() => applications.filter((app) => !app.archived), [applications]);

  const filtered = useMemo(() => {
    const term = (search.q ?? "").trim().toLowerCase();
    const quick: QuickFilter = search.quick ?? "all";
    return active.filter((app) => {
      if (!matchesQuickFilter(app.stage, quick)) return false;
      if (quick !== "closed" && CLOSED_STAGES.includes(app.stage)) return false;
      if (term) {
        const hay = `${app.role_title} ${app.companies?.name ?? ""} ${app.location ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (search.stage && app.stage !== search.stage) return false;
      if (search.company && app.companies?.name !== search.company) return false;
      if (search.location && app.location !== search.location) return false;
      if (search.country && app.country !== search.country) return false;
      if (search.industry && app.companies?.industry !== search.industry) return false;
      if (search.type && app.application_type !== search.type) return false;
      if (search.mode && app.work_mode !== search.mode) return false;
      if (search.source && app.source !== search.source) return false;
      if (search.priority && (app.priority ?? "medium") !== search.priority) return false;
      if (search.appliedFrom && (!app.applied_at || app.applied_at < search.appliedFrom)) return false;
      if (search.appliedTo && (!app.applied_at || app.applied_at > search.appliedTo)) return false;
      if (search.deadlineFrom && (!app.deadline_at || app.deadline_at < search.deadlineFrom)) return false;
      if (search.deadlineTo && (!app.deadline_at || app.deadline_at > search.deadlineTo)) return false;
      return true;
    });
  }, [active, search]);

  const sorted = useMemo(() => {
    const sort = search.sort ?? "applied_at";
    const rows = [...filtered];
    rows.sort((a, b) => {
      switch (sort) {
        case "waiting":
          return daysWaiting(b) - daysWaiting(a);
        case "priority":
          return (PRIORITY_RANK[a.priority ?? "medium"] ?? 1) - (PRIORITY_RANK[b.priority ?? "medium"] ?? 1);
        case "deadline":
          return (a.deadline_at ?? "9999").localeCompare(b.deadline_at ?? "9999");
        case "company":
          return (a.companies?.name ?? "").localeCompare(b.companies?.name ?? "");
        case "applied_at":
        default:
          return (b.applied_at ?? "").localeCompare(a.applied_at ?? "");
      }
    });
    return rows;
  }, [filtered, search.sort]);

  const view = search.view ?? "table";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Candidaturas")}
        description={t("{n} de {total} procesos", { n: sorted.length, total: active.length })}
        actions={
          <>
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              <button
                onClick={() => patchSearch({ view: "table" })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  view === "table" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
                )}
              >
                <TableIcon className="size-3.5" /> {t("Tabla")}
              </button>
              <button
                onClick={() => patchSearch({ view: "kanban" })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  view === "kanban" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
                )}
              >
                <LayoutGrid className="size-3.5" /> {t("Kanban")}
              </button>
            </div>
            <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" /> {t("Nueva candidatura")}
            </Button>
          </>
        }
      />

      <AppsFilters search={search} onChange={patchSearch} applications={active} />

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <EmptyState
          title={t("Aquí empieza tu próxima oportunidad")}
          description={t("Añade tu primera candidatura y empieza a construir tu pipeline.")}
          icon={<Briefcase className="size-6" />}
          action={
            <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" /> {t("Añadir candidatura")}
            </Button>
          }
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={t("Sin candidaturas que coincidan")}
          description={t("Prueba a ajustar los filtros o la búsqueda.")}
          icon={<Briefcase className="size-6" />}
        />
      ) : view === "kanban" ? (
        <AppsKanban applications={sorted} events={events} />
      ) : (
        <AppsTable applications={sorted} documents={documents} events={events} />
      )}

      <ApplicationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

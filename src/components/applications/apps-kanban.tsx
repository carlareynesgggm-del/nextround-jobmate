import { useState, type DragEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyMark } from "@/components/ui-bits";
import { useMoveStage } from "@/lib/api";
import { applicationAlerts } from "@/lib/alerts";
import {
  KANBAN_STAGES,
  STAGE_META,
  UNKNOWN,
  type ApplicationWithCompany,
  type CalendarRow,
  type Stage,
} from "@/lib/domain";
import { relativeDay } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function daysWaiting(app: ApplicationWithCompany): number | null {
  if (!app.applied_at) return null;
  const date = new Date(app.applied_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - date.getTime()) / 86_400_000));
}

export function AppsKanban({
  applications,
  events,
}: {
  applications: ApplicationWithCompany[];
  events: CalendarRow[];
}) {
  const t = useT();
  const moveStage = useMoveStage();
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const move = (app: ApplicationWithCompany, to: Stage) => {
    if (app.stage === to) return;
    moveStage.mutate({ application: app, to });
  };

  return (
    <div className="scrollbar-slim -mx-1 flex gap-4 overflow-x-auto px-1 pb-4">
      {KANBAN_STAGES.map((stage) => {
        const items = applications.filter((app) => app.stage === stage);
        const isOver = dragOverStage === stage;
        return (
          <div key={stage} className="w-[280px] shrink-0">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", STAGE_META[stage].dot)} />
                <h3 className="text-sm font-semibold">{t(STAGE_META[stage].label)}</h3>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{items.length}</span>
            </div>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverStage(stage);
              }}
              onDragLeave={() => setDragOverStage((current) => (current === stage ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                setDragOverStage(null);
                const id = event.dataTransfer.getData("text/application-id") || draggingId;
                const app = applications.find((a) => a.id === id);
                if (app) move(app, stage);
                setDraggingId(null);
              }}
              className={cn(
                "min-h-[3rem] space-y-2.5 rounded-2xl bg-surface-2/60 p-2.5 transition-colors",
                isOver && "bg-primary/10 ring-1 ring-primary/30",
              )}
            >
              {items.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  {t("Nada en esta etapa")}
                </p>
              )}
              {items.map((app) => (
                <KanbanCard
                  key={app.id}
                  app={app}
                  events={events}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/application-id", app.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingId(app.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  onMove={(to) => move(app, to)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  app,
  events,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  app: ApplicationWithCompany;
  events: CalendarRow[];
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onMove: (to: Stage) => void;
}) {
  const t = useT();
  const waiting = daysWaiting(app);
  let alerts: ReturnType<typeof applicationAlerts> = [];
  try {
    alerts = applicationAlerts(app, { events });
  } catch {
    alerts = [];
  }
  const alert = alerts[0];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group rounded-xl border border-border bg-surface p-3 shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-2">
        <Link to="/applications/$id" params={{ id: app.id }} className="flex min-w-0 flex-1 items-start gap-2.5">
          <CompanyMark name={app.companies?.name ?? app.role_title} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">{app.role_title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {app.companies?.name ?? t("Sin empresa")}
            </p>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={t("Cambiar etapa de {role}", { role: app.role_title })}
              className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronDown className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {KANBAN_STAGES.map((stage) => (
              <DropdownMenuItem key={stage} onSelect={() => onMove(stage)}>
                {t(STAGE_META[stage].label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
        {waiting !== null && <span>{waiting} {t("días")}</span>}
        {app.deadline_at && <span>{relativeDay(app.deadline_at)}</span>}
        {app.location && <span className="truncate">{app.location ?? UNKNOWN}</span>}
      </div>

      {alert && (
        <p
          className={cn(
            "mt-2 truncate rounded-md px-2 py-1 text-[11px] font-medium",
            alert.tone === "danger"
              ? "bg-danger/10 text-danger"
              : alert.tone === "warn"
                ? "bg-warning/15 text-gold-foreground"
                : "bg-info/10 text-info",
          )}
        >
          {t(alert.label)}
        </p>
      )}
    </div>
  );
}

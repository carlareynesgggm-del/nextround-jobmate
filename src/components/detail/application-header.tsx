import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyMark, StageBadge } from "@/components/ui-bits";
import { useMoveStage } from "@/lib/api";
import {
  PIPELINE_STAGES,
  STAGE_META,
  WORK_MODE_LABEL,
  type ApplicationWithCompany,
} from "@/lib/domain";
import { fmtDate } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function ApplicationHeader({
  app,
  days,
  onEdit,
  onExport,
  onDelete,
}: {
  app: ApplicationWithCompany;
  days: number | null;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const moveStage = useMoveStage();
  const [deleting, setDeleting] = useState(false);
  const stageIndex = PIPELINE_STAGES.indexOf(app.stage);

  const meta = [
    app.location,
    app.country,
    app.work_mode ? WORK_MODE_LABEL[app.work_mode] : null,
    app.application_type,
    app.applied_at ? t("Enviada el {date}", { date: fmtDate(app.applied_at) }) : null,
  ].filter(Boolean);

  return (
    <header className="space-y-7 border-b border-border/70 pb-7">
      <Link
        to="/applications"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {t("Candidaturas")}
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <CompanyMark name={app.companies?.name ?? app.role_title} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-[13px] font-medium text-muted-foreground">
                {app.companies?.name ?? t("Sin empresa")}
              </p>
              <StageBadge stage={app.stage} />
            </div>
            <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight sm:text-[36px]">
              {app.role_title}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {meta.join(" · ") || t("Sin especificar")}
              {days !== null ? ` · ${t("hace {n} días", { n: days })}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            className="gap-1.5"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("nextround:ai", {
                  detail: {
                    applicationId: app.id,
                    prompt: `Ayúdame a preparar la candidatura de ${app.role_title} en ${
                      app.companies?.name ?? "esta empresa"
                    }.`,
                  },
                }),
              )
            }
          >
            <Sparkles className="size-4" /> {t("Preparar con IA")}
          </Button>
          {app.candidate_portal_url && (
            <Button asChild variant="outline" className="gap-1.5">
              <a href={app.candidate_portal_url} target="_blank" rel="noreferrer">
                <KeyRound className="size-4" /> {t("Abrir portal")}
              </a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("Más acciones")}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {app.job_url && (
                <DropdownMenuItem asChild>
                  <a href={app.job_url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                    <ExternalLink className="size-3.5" /> {t("Ver oferta original")}
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="size-3.5" /> {t("Editar")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport} className="gap-2">
                <Download className="size-3.5" /> {t("Exportar resumen")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-danger focus:text-danger"
                onClick={async () => {
                  if (deleting) return;
                  setDeleting(true);
                  try {
                    onDelete();
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                <Trash2 className="size-3.5" /> {t("Eliminar")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          {t("Fase del proceso")}
        </p>
        <div className="scrollbar-slim mt-2.5 flex items-center gap-1 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, index) => (
            <button
              key={stage}
              onClick={() => moveStage.mutate({ application: app, to: stage })}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                stage === app.stage
                  ? "bg-primary text-primary-foreground"
                  : stageIndex >= index
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:bg-surface-2",
              )}
            >
              {t(STAGE_META[stage].short)}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

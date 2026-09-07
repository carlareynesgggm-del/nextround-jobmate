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
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyMark } from "@/components/ui-bits";
import { useMoveStage } from "@/lib/api";
import {
  PIPELINE_STAGES,
  STAGE_META,
  WORK_MODE_LABEL,
  formatSalary,
  type ApplicationWithCompany,
  type Stage,
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
    app.location ? app.country : app.country,
    app.work_mode ? WORK_MODE_LABEL[app.work_mode] : null,
    app.application_type,
    app.applied_at ? t("Enviada el {date}", { date: fmtDate(app.applied_at) }) : null,
  ].filter(Boolean);

  return (
    <header className="space-y-6">
      <Link
        to="/applications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t("Candidaturas")}
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <CompanyMark name={app.companies?.name ?? app.role_title} size="lg" />
          <div className="min-w-0">
            <p className="font-display text-sm font-medium text-muted-foreground">
              {app.companies?.name ?? t("Sin empresa")}
            </p>
            <h1 className="mt-0.5 font-display text-3xl font-semibold leading-tight tracking-tight">
              {app.role_title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{meta.join(" · ") || t("Sin especificar")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="gap-1.5 rounded-xl"
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
            <Button asChild variant="outline" className="gap-1.5 rounded-xl">
              <a href={app.candidate_portal_url} target="_blank" rel="noreferrer">
                <KeyRound className="size-4" /> {t("Abrir portal")}
              </a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("Más acciones")} className="rounded-xl">
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
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("Etapa actual: {stage}", { stage: t(STAGE_META[app.stage].label) })}</span>
          {days !== null && <span>{t("hace {n} días", { n: days })}</span>}
        </div>
        <div className="scrollbar-slim mt-3 flex items-center gap-1 overflow-x-auto">
          {PIPELINE_STAGES.map((stage, index) => (
            <button
              key={stage}
              onClick={() => moveStage.mutate({ application: app, to: stage })}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                stage === app.stage
                  ? "bg-violet text-primary-foreground"
                  : stageIndex >= index
                    ? "bg-violet/12 text-violet"
                    : "text-muted-foreground hover:bg-accent",
              )}
            >
              {t(STAGE_META[stage].short)}
              {stageIndex > index && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

import { Link } from "@tanstack/react-router";

import { CompanyMark, Pill, StageBadge } from "@/components/ui-bits";
import { applicationAlerts } from "@/lib/alerts";
import {
  PRIORITY_LABEL,
  UNKNOWN,
  WORK_MODE_LABEL,
  formatSalary,
  priorityTone,
  type AppDocumentWithDoc,
  type ApplicationWithCompany,
  type CalendarRow,
} from "@/lib/domain";
import { fmtDate, relativeDay } from "@/lib/format";
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

function cvName(app: ApplicationWithCompany, docs: AppDocumentWithDoc[]): string | null {
  const link = docs.find((d) => d.application_id === app.id && (d.role === "cv" || !d.role));
  return link?.documents?.name ?? null;
}

function AlertDot({ app, events }: { app: ApplicationWithCompany; events: CalendarRow[] }) {
  const t = useT();
  let alerts: ReturnType<typeof applicationAlerts> = [];
  try {
    alerts = applicationAlerts(app, { events });
  } catch {
    alerts = [];
  }
  if (alerts.length === 0) return null;
  const alert = alerts[0];
  if (!alert) return null;
  return (
    <span
      title={`${t(alert.label)} · ${alert.detail}`}
      className={cn(
        "inline-flex size-1.5 shrink-0 rounded-full",
        alert.tone === "danger" ? "bg-danger" : alert.tone === "warn" ? "bg-warning" : "bg-info",
      )}
    />
  );
}

export function AppsTable({
  applications,
  documents,
  events,
}: {
  applications: ApplicationWithCompany[];
  documents: AppDocumentWithDoc[];
  events: CalendarRow[];
}) {
  const t = useT();

  return (
    <>
      <div className="hidden overflow-visible md:block">
        <div className="scrollbar-slim max-h-[calc(100dvh-19rem)] overflow-auto rounded-xl border border-border/70 bg-surface">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
              <tr className="border-b border-border/60 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
                <th className="px-4 py-2.5 font-medium">{t("Candidatura")}</th>
                <th className="px-3 py-2.5 font-medium">{t("Etapa")}</th>
                <th className="px-3 py-2.5 font-medium">{t("Fecha de solicitud")}</th>
                <th className="px-3 py-2.5 font-medium">{t("Próxima acción")}</th>
                <th className="px-3 py-2.5 font-medium">{t("Próxima fecha límite")}</th>
                <th className="px-3 py-2.5 font-medium">{t("CV usado")}</th>
                <th className="px-3 py-2.5 font-medium">{t("Salario")}</th>
                <th className="px-3 py-2.5 font-medium">{t("Prioridad")}</th>
                <th className="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {applications.map((app) => {
                const waiting = daysWaiting(app);
                const cv = cvName(app, documents);
                const meta = [
                  app.application_type,
                  app.location,
                  app.work_mode ? WORK_MODE_LABEL[app.work_mode] : null,
                ].filter(Boolean) as string[];
                return (
                  <tr
                    key={app.id}
                    className="group relative transition-colors duration-150 hover:bg-surface-2/60"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        to="/applications/$id"
                        params={{ id: app.id }}
                        className="flex items-center gap-2.5 focus-visible:outline-none"
                      >
                        <CompanyMark name={app.companies?.name ?? app.role_title} size="sm" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="max-w-[13rem] truncate font-medium">{app.role_title}</span>
                            <AlertDot app={app} events={events} />
                          </span>
                          <span className="block max-w-[15rem] truncate text-[11px] text-muted-foreground">
                            {app.companies?.name ?? t("Sin empresa")}
                            {meta.length > 0 && ` · ${meta.join(" · ")}`}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <StageBadge stage={app.stage} />
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <span className="block">{fmtDate(app.applied_at)}</span>
                      {waiting !== null && (
                        <span className="block text-[11px] tabular-nums text-muted-foreground/70">
                          {waiting} {t("días")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {app.next_action ? (
                        <span>
                          <span className="block max-w-[10rem] truncate">{app.next_action}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {relativeDay(app.next_action_at)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {app.deadline_at ? relativeDay(app.deadline_at) : <span className="text-muted-foreground/60">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <span className="block max-w-[8rem] truncate">{cv ?? t("Sin CV")}</span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                      {formatSalary(app.salary_min, app.salary_max, app.currency ?? "EUR")}
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill tone={priorityTone(app.priority ?? "medium")}>
                        {PRIORITY_LABEL[app.priority ?? "medium"]}
                      </Pill>
                    </td>
                    <td className="px-2 py-2.5">
                      <Link
                        to="/applications/$id"
                        params={{ id: app.id }}
                        aria-label={t("Abrir candidatura")}
                        title={t("Abrir candidatura")}
                        className="inline-flex rounded-md p-1.5 text-muted-foreground/50 opacity-0 transition-all duration-150 hover:bg-surface-2 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {applications.map((app) => {
          const waiting = daysWaiting(app);
          return (
            <Link
              key={app.id}
              to="/applications/$id"
              params={{ id: app.id }}
              className="block rounded-xl border border-border/70 bg-surface p-4"
            >
              <div className="flex items-start gap-2.5">
                <CompanyMark name={app.companies?.name ?? app.role_title} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{app.role_title}</p>
                    <AlertDot app={app} events={events} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {app.companies?.name ?? t("Sin empresa")} · {app.location ?? UNKNOWN}
                  </p>
                </div>
                <StageBadge stage={app.stage} className="shrink-0" />
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {waiting !== null && <span>{waiting} {t("días")}</span>}
                {app.deadline_at && <span>{relativeDay(app.deadline_at)}</span>}
                {app.next_action && <span className="truncate">→ {app.next_action}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

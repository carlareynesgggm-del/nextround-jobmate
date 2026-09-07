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
        <div className="scrollbar-slim max-h-[calc(100dvh-20rem)] overflow-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur">
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">{t("Empresa")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Puesto")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Tipo")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Ubicación")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Etapa")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Fecha de solicitud")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Días esperando")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Próxima acción")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Próxima fecha límite")}</th>
                <th className="px-4 py-2.5 font-medium">{t("CV usado")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Salario")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Prioridad")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((app) => {
                const waiting = daysWaiting(app);
                const cv = cvName(app, documents);
                return (
                  <tr key={app.id} className="group relative transition-colors hover:bg-accent/40">
                    <td className="px-4 py-2.5">
                      <Link
                        to="/applications/$id"
                        params={{ id: app.id }}
                        className="flex items-center gap-2.5 focus-visible:outline-none"
                      >
                        <CompanyMark name={app.companies?.name ?? app.role_title} size="sm" />
                        <span className="max-w-[10rem] truncate font-medium">
                          {app.companies?.name ?? t("Sin empresa")}
                        </span>
                        <AlertDot app={app} events={events} />
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link to="/applications/$id" params={{ id: app.id }} className="block max-w-[12rem] truncate">
                        {app.role_title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{app.application_type ?? UNKNOWN}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <span className="block max-w-[9rem] truncate">{app.location ?? UNKNOWN}</span>
                      {app.work_mode && (
                        <span className="text-xs">{WORK_MODE_LABEL[app.work_mode]}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <StageBadge stage={app.stage} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(app.applied_at)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                      {waiting !== null ? `${waiting} ${t("días")}` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {app.next_action ? (
                        <span>
                          <span className="block max-w-[10rem] truncate">{app.next_action}</span>
                          <span className="block text-xs text-muted-foreground">
                            {relativeDay(app.next_action_at)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {app.deadline_at ? relativeDay(app.deadline_at) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <span className="block max-w-[8rem] truncate">{cv ?? t("Sin CV")}</span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatSalary(app.salary_min, app.salary_max, app.currency ?? "EUR")}
                    </td>
                    <td className="px-4 py-2.5">
                      <Pill tone={priorityTone(app.priority ?? "medium")}>
                        {PRIORITY_LABEL[app.priority ?? "medium"]}
                      </Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2.5 md:hidden">
        {applications.map((app) => {
          const waiting = daysWaiting(app);
          return (
            <Link
              key={app.id}
              to="/applications/$id"
              params={{ id: app.id }}
              className="block rounded-xl border border-border bg-surface p-3.5 shadow-soft"
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

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { useApplications, useCalendar } from "@/lib/api";
import { useAlerts, useResolveAlert } from "@/lib/inbox/api";
import { ALERT_CATEGORY_LABEL, alertPriorityTone, type AlertCategory } from "@/lib/inbox/domain";
import { attentionFeed, nextActionTone } from "@/lib/next-action";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Campana de avisos: alertas derivadas de fechas límite, entrevistas y silencios. */
export function AlertsBell({ className }: { className?: string }) {
  const t = useT();
  const { data: applications = [] } = useApplications();
  const { data: events = [] } = useCalendar();
  const [open, setOpen] = useState(false);

  const { data: saved = [] } = useAlerts();
  const resolve = useResolveAlert();

  const feed = attentionFeed(applications, { events }, 6).filter((item) => item.action.urgency <= 4);
  const count = feed.length + saved.length;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={t("Avisos")}
        className="relative inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-violet text-[10px] font-semibold text-primary-foreground">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-30 cursor-default" aria-label={t("Cerrar avisos")} onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-lift">
            <p className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("Avisos")}
            </p>
            {saved.length > 0 && (
              <ul className="divide-y divide-border border-b border-border">
                {saved.slice(0, 6).map((alert) => (
                  <li key={alert.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          alertPriorityTone(alert.priority),
                        )}
                      >
                        {t(ALERT_CATEGORY_LABEL[alert.category as AlertCategory] ?? alert.category)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-snug">{alert.title}</p>
                    {alert.detail && <p className="text-xs text-muted-foreground">{alert.detail}</p>}
                    <div className="mt-1.5 flex items-center gap-3">
                      {alert.application_id && (
                        <Link
                          to="/applications/$id"
                          params={{ id: alert.application_id }}
                          onClick={() => setOpen(false)}
                          className="text-xs text-violet hover:underline"
                        >
                          {t("Ver candidatura")}
                        </Link>
                      )}
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => void resolve.mutateAsync(alert.id)}
                      >
                        {t("Marcar como resuelto")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {count === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">{t("Nada urgente ahora mismo.")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {feed.map(({ app, action }) => (
                  <li key={app.id}>
                    <Link
                      to="/applications/$id"
                      params={{ id: app.id }}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", nextActionTone(action.tone))}>
                          {app.companies?.name ?? app.role_title}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium leading-snug">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.detail}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

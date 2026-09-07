import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { useApplications, useCalendar } from "@/lib/api";
import { attentionFeed, nextActionTone } from "@/lib/next-action";
import { cn } from "@/lib/utils";

/** Campana de avisos: alertas derivadas de fechas límite, entrevistas y silencios. */
export function AlertsBell({ className }: { className?: string }) {
  const { data: applications = [] } = useApplications();
  const { data: events = [] } = useCalendar();
  const [open, setOpen] = useState(false);

  const feed = attentionFeed(applications, { events }, 6).filter((item) => item.action.urgency <= 4);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Avisos"
        className="relative inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="size-4" />
        {feed.length > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-violet text-[10px] font-semibold text-primary-foreground">
            {feed.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-30 cursor-default" aria-label="Cerrar avisos" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-lift">
            <p className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avisos
            </p>
            {feed.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">Nada urgente ahora mismo.</p>
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

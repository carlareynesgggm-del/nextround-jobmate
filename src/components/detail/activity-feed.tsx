import { Activity } from "lucide-react";

import { EmptyState, SectionCard } from "@/components/ui-bits";
import { useT } from "@/lib/i18n/provider";
import { useActivity } from "@/lib/inbox/api";
import { fmtDate } from "@/lib/format";

/** Historial cronológico de lo que ha pasado en esta candidatura. */
export function ActivityFeed({ applicationId }: { applicationId: string }) {
  const t = useT();
  const { data: rows = [] } = useActivity(applicationId);

  return (
    <SectionCard title={t("Actividad")}>
      {rows.length === 0 ? (
        <EmptyState
          title={t("Sin actividad todavía")}
          description={t("Aquí se irá registrando cada movimiento del proceso.")}
          icon={<Activity className="size-5" />}
        />
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="flex gap-4">
              <span className="w-16 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                {fmtDate(row.occurred_at)}
              </span>
              <div className="min-w-0 flex-1 border-l border-border pl-4">
                <p className="text-sm font-medium leading-snug">{row.title}</p>
                {row.detail && (
                  <p className="mt-0.5 line-clamp-3 text-xs text-muted-foreground">{row.detail}</p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {row.source === "email" ? t("Origen: correo") : t("Origen: NextRound")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

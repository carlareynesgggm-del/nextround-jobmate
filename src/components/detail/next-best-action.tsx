import { ExternalLink, KeyRound, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { nextActionTone, type NextAction } from "@/lib/next-action";
import type { ApplicationWithCompany } from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function NextBestActionCard({
  app,
  action,
}: {
  app: ApplicationWithCompany;
  action: NextAction | null;
}) {
  const t = useT();

  if (!action) return null;

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("Siguiente mejor acción")}
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold tracking-tight">{t(action.label)}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t(action.detail)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", nextActionTone(action.tone))}>
            {t(action.ctaLabel)}
          </span>
          <Button
            size="sm"
            className="gap-1.5 rounded-xl"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("nextround:ai", {
                  detail: {
                    applicationId: app.id,
                    prompt: `${action.label}. ${action.detail}`,
                  },
                }),
              )
            }
          >
            <Sparkles className="size-3.5" /> {t("Preparar con IA")}
          </Button>
          {action.href ? (
            <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-xl">
              <a href={action.href} target="_blank" rel="noreferrer">
                <KeyRound className="size-3.5" /> {t(action.ctaLabel)}
              </a>
            </Button>
          ) : app.candidate_portal_url ? (
            <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-xl">
              <a href={app.candidate_portal_url} target="_blank" rel="noreferrer">
                <KeyRound className="size-3.5" /> {t("Portal del candidato")}
              </a>
            </Button>
          ) : null}
          {app.job_url && (
            <Button asChild size="sm" variant="ghost" className="gap-1.5">
              <a href={app.job_url} target="_blank" rel="noreferrer">
                {t("Ver oferta")} <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { ArrowUpRight, KeyRound, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NextAction } from "@/lib/next-action";
import type { ApplicationWithCompany } from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";

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
    <div className="rounded-xl border border-border/70 bg-surface p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("Siguiente acción")}
          </p>
          <p className="mt-1.5 font-display text-[17px] font-semibold tracking-tight">{t(action.label)}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t(action.detail)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5"
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
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <a href={action.href} target="_blank" rel="noreferrer">
                <KeyRound className="size-3.5" /> {t(action.ctaLabel)}
              </a>
            </Button>
          ) : app.candidate_portal_url ? (
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <a href={app.candidate_portal_url} target="_blank" rel="noreferrer">
                <KeyRound className="size-3.5" /> {t("Portal del candidato")}
              </a>
            </Button>
          ) : null}
          {app.job_url && (
            <a
              href={app.job_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("Ver oferta")} <ArrowUpRight className="size-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

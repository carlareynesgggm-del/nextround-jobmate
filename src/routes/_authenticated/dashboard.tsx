import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, ExternalLink, Sparkles } from "lucide-react";

import { CompanyMark, EmptyState, StageBadge } from "@/components/ui-bits";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { useApplications, useCalendar, useProfile } from "@/lib/api";
import { attentionFeed, nextActionTone } from "@/lib/next-action";
import { PIPELINE_STAGES, STAGE_META, isActive } from "@/lib/domain";
import { daysFromToday, fmtDateTime, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Inicio — NextRound" },
      {
        name: "description",
        content:
          "Lo que necesita tu atención hoy: pruebas, entrevistas y seguimientos de tus candidaturas.",
      },
      { property: "og:title", content: "Inicio — NextRound" },
      {
        property: "og:description",
        content: "Tu asistente de búsqueda de empleo te dice qué hacer ahora mismo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function greeting(t: (text: string, vars?: Record<string, string | number>) => string): string {
  const hour = new Date().getHours();
  if (hour < 6) return t("Buenas noches");
  if (hour < 13) return t("Buenos días");
  if (hour < 21) return t("Buenas tardes");
  return t("Buenas noches");
}

function translateAction(
  t: (text: string, vars?: Record<string, string | number>) => string,
  action: ReturnType<typeof attentionFeed>[number]["action"],
) {
  const labelMap: Record<string, string> = {
    interview: t("Prepara la entrevista"),
    cv: t("Sube el CV que usaste"),
    notes: t("Añade notas de la entrevista"),
    review: t("Define tu próximo paso"),
  };
  const detailMap: Record<string, string> = {
    cv: t("Así podrás comparar qué versión funciona mejor"),
    review: t("Esta candidatura no tiene ninguna acción pendiente"),
  };
  const ctaMap: Record<string, string> = {
    interview: t("Preparar con IA"),
    cv: t("Vincular CV"),
    notes: t("Escribir notas"),
    followup: t("Hacer seguimiento"),
    custom: t("Ver candidatura"),
    review: t("Ver candidatura"),
  };
  return {
    ...action,
    label: labelMap[action.kind] ?? action.label,
    detail: detailMap[action.kind] ?? action.detail,
    ctaLabel: ctaMap[action.kind] ?? (action.ctaLabel === "Abrir portal" ? t("Abrir portal") : action.ctaLabel === "Preparar" ? t("Preparar") : action.ctaLabel),
  };
}

function HomePage() {
  const t = useT();
  const { data: applications = [], isLoading } = useApplications();
  const { data: events = [] } = useCalendar();
  const { data: profile } = useProfile();

  const firstName = (((profile as { full_name?: string | null } | null)?.full_name) ?? "").split(" ")[0] || t("de nuevo");
  const active = applications.filter((app) => isActive(app.stage) && !app.archived);
  const responded = applications.filter((app) => !["saved", "applied"].includes(app.stage)).length;
  const sent = applications.filter((app) => app.stage !== "saved").length;
  const responseRate = sent ? Math.round((responded / sent) * 100) : 0;
  const offers = applications.filter((app) => app.stage === "offer").length;

  const feed = attentionFeed(applications, { events }, 4);
  const upcoming = events
    .filter((event) => new Date(event.starts_at).getTime() >= Date.now() - 3_600_000)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 4);
  const interviewsThisWeek = events.filter((event) => {
    const diff = daysFromToday(event.starts_at);
    return diff !== null && diff >= 0 && diff <= 7;
  }).length;

  const counts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: applications.filter((app) => app.stage === stage).length,
  }));
  const maxCount = Math.max(1, ...counts.map((entry) => entry.count));

  return (
    <div className="space-y-16 py-8">
      <section className="space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">{greeting(t)}, {firstName}</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem]">
            {isLoading
              ? t("Cargando tu búsqueda…")
              : feed.length === 0
                ? t("Hoy no tienes nada urgente.")
                : t(
                    feed.length === 1
                      ? "Tienes {n} cosa que necesita atención"
                      : "Tienes {n} cosas que necesitan atención",
                    { n: feed.length },
                  )}
          </h1>
        </div>

        {feed.length === 0 ? (
          <EmptyState
            title={t("Todo al día")}
            description={t("Buen momento para añadir candidaturas nuevas o pulir tu CV.")}
            icon={<Sparkles className="size-6" />}
            action={
              <Button asChild>
                <Link to="/applications">{t("Ver candidaturas")}</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {feed.map(({ app, action: rawAction }) => {
              const action = translateAction(t, rawAction);
              return (
              <li
                key={app.id}
                className="group rounded-2xl bg-surface p-5 shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="flex items-center gap-3">
                  <CompanyMark name={app.companies?.name ?? app.role_title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-semibold tracking-tight">
                      {app.companies?.name ?? app.role_title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{app.role_title}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      nextActionTone(action.tone),
                    )}
                  >
                    {STAGE_META[app.stage].short}
                  </span>
                </div>

                <p className="mt-4 text-sm font-medium leading-snug">{action.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{action.detail}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" className="rounded-xl">
                    <Link to="/applications/$id" params={{ id: app.id }}>
                      {action.ctaLabel}
                    </Link>
                  </Button>
                  {app.candidate_portal_url && (
                    <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-xl">
                      <a href={app.candidate_portal_url} target="_blank" rel="noreferrer">
                        {t("Abrir portal")} <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">{t("Próximas citas")}</h2>
            <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground">
              {t("Calendario")}
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="size-4" /> {t("Nada agendado todavía.")}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {upcoming.map((event) => (
                <li key={event.id} className="flex items-center gap-4 py-3.5">
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-semibold">{relativeDay(event.starts_at)}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDateTime(event.starts_at)}</p>
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm">{event.title}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {t("{n} min", { n: event.duration_min ?? 30 })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">{t("Pipeline")}</h2>
          <ul className="mt-4 space-y-3">
            {counts.map(({ stage, count }) => (
              <li key={stage}>
                <div className="flex items-center justify-between text-xs">
                  <span>{STAGE_META[stage].label}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn("h-full rounded-full", STAGE_META[stage].dot)}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight">{t("Tu búsqueda en cifras")}</h2>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-6 sm:grid-cols-4">
          <Metric label={t("Candidaturas")} value={applications.length} />
          <Metric label={t("Procesos activos")} value={active.length} />
          <Metric label={t("Tasa de respuesta")} value={`${responseRate}%`} hint={`${responded}/${sent}`} />
          <Metric label={t("Ofertas")} value={offers} />
        </dl>
        <div className="mt-6">
          <Link
            to="/analytics"
            className="inline-flex items-center gap-1.5 text-sm text-violet hover:underline"
          >
            {t("Ver insights completos")} <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("Entrevistas en los próximos 7 días: {n}", { n: interviewsThisWeek })}
        </p>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div>
      <dd className="font-display text-3xl font-semibold tabular-nums tracking-tight">{value}</dd>
      <dt className="mt-1 text-xs text-muted-foreground">
        {label}
        {hint ? ` · ${hint}` : ""}
      </dt>
    </div>
  );
}

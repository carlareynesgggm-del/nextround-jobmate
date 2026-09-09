import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";

import { AttentionCard } from "@/components/home/attention-list";
import { UpdatesPanel } from "@/components/inbox/updates-panel";
import { EmptyState } from "@/components/ui-bits";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { useAllApplicationDocuments, useApplications, useCalendar, useProfile } from "@/lib/api";
import { attentionFeed } from "@/lib/next-action";
import { CLOSED_STAGES, STAGE_META, UNKNOWN, isActive } from "@/lib/domain";
import { daysSinceApplied } from "@/lib/alerts";
import { daysFromToday, fmtDateTime, relativeDay, toDate } from "@/lib/format";

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

function greeting(t: (text: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 6) return t("Buenas noches");
  if (hour < 13) return t("Buenos días");
  if (hour < 21) return t("Buenas tardes");
  return t("Buenas noches");
}

function HomePage() {
  const t = useT();
  const { data: applications = [], isLoading } = useApplications();
  const { data: events = [] } = useCalendar();
  const { data: links = [] } = useAllApplicationDocuments();
  const { data: profile } = useProfile();

  const firstName =
    (((profile as { full_name?: string | null } | null)?.full_name) ?? "").split(" ")[0] || t("de nuevo");
  const followUpDays = (profile as { follow_up_days?: number } | null)?.follow_up_days ?? 14;

  const active = applications.filter((app) => isActive(app.stage) && !app.archived);
  const offers = applications.filter((app) => app.stage === "offer").length;
  const interviewsThisWeek = events.filter((event) => {
    const diff = daysFromToday(event.starts_at);
    return diff !== null && diff >= 0 && diff <= 7 && (event.kind === "interview" || event.kind === "call");
  }).length;

  const feed = attentionFeed(applications, { events, links, followUpDays }, 4);
  const feedEvents = new Map(
    feed.map(({ app }) => {
      const now = Date.now();
      const match = events
        .filter((event) => event.application_id === app.id)
        .filter((event) => (toDate(event.starts_at)?.getTime() ?? 0) >= now - 3_600_000)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
      return [app.id, match] as const;
    }),
  );

  const upcoming = events
    .filter((event) => new Date(event.starts_at).getTime() >= Date.now() - 3_600_000)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 5);

  const waiting = applications
    .filter((app) => !app.archived && isActive(app.stage) && app.stage !== "saved")
    .map((app) => ({ app, days: daysSinceApplied(app) }))
    .sort((a, b) => (b.days ?? 0) - (a.days ?? 0))
    .slice(0, 6);

  const recentActivity = applications
    .filter((app) => !app.archived)
    .slice()
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, 6);

  return (
    <div className="space-y-16 py-8">
      <section className="space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">
            {greeting(t)}, {firstName}
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem]">
            {isLoading
              ? t("Cargando tu búsqueda…")
              : feed.length === 0
                ? t("Todo al día")
                : t(
                    feed.length === 1
                      ? "Tienes {n} cosa que necesita tu atención"
                      : "Tienes {n} cosas que necesitan tu atención",
                    { n: feed.length },
                  )}
          </h1>
        </div>

        {feed.length === 0 ? (
          <EmptyState
            title={t("Nada pendiente por ahora")}
            description={t("Buen momento para añadir candidaturas nuevas o pulir tu CV.")}
            icon={<Sparkles className="size-6" />}
            action={
              <Button asChild>
                <Link to="/applications">{t("Ver candidaturas")}</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {feed.map(({ app, action }) => {
              const event = feedEvents.get(app.id);
              return (
                <AttentionCard
                  key={app.id}
                  app={app}
                  action={action}
                  {...(event ? { event } : {})}
                />
              );
            })}
          </ul>
        )}
      </section>

      <UpdatesPanel />

      <section>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-6 sm:grid-cols-4">
          <Metric label={t("Candidaturas totales")} value={applications.length} />
          <Metric label={t("Procesos activos")} value={active.length} />
          <Metric label={t("Entrevistas esta semana")} value={interviewsThisWeek} />
          <Metric label={t("Ofertas")} value={offers} />
        </dl>
        <div className="mt-6">
          <Link to="/analytics" className="inline-flex items-center gap-1.5 text-sm text-violet hover:underline">
            {t("Ver insights completos")} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">{t("Próximamente")}</h2>
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
                  {event.application_id ? (
                    <Link
                      to="/applications/$id"
                      params={{ id: event.application_id }}
                      className="min-w-0 flex-1 truncate text-sm hover:text-violet"
                    >
                      {event.title}
                    </Link>
                  ) : (
                    <p className="min-w-0 flex-1 truncate text-sm">{event.title}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">{t("Candidaturas activas")}</h2>
            <Link to="/applications" className="text-xs text-muted-foreground hover:text-foreground">
              {t("Ver todas")}
            </Link>
          </div>
          {waiting.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("Aquí empieza tu próxima oportunidad.")}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {waiting.map(({ app, days }) => (
                <li key={app.id} className="flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/applications/$id"
                      params={{ id: app.id }}
                      className="truncate text-sm font-medium hover:text-violet"
                    >
                      {app.companies?.name ?? UNKNOWN}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{app.role_title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{t(STAGE_META[app.stage].short)}</span>
                  {days !== null && (
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {t("{n} días", { n: days })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight">{t("Actividad reciente")}</h2>
        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("Todavía no hay movimientos.")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {recentActivity.map((app) => (
              <li key={app.id} className="flex items-center gap-4 py-3.5">
                <span className="w-28 shrink-0 text-xs text-muted-foreground">
                  {app.updated_at ? relativeDay(app.updated_at) : UNKNOWN}
                </span>
                <Link
                  to="/applications/$id"
                  params={{ id: app.id }}
                  className="min-w-0 flex-1 truncate text-sm hover:text-violet"
                >
                  {app.companies?.name ?? UNKNOWN} · {app.role_title}
                </Link>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {CLOSED_STAGES.includes(app.stage) ? t(STAGE_META[app.stage].label) : t(STAGE_META[app.stage].short)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dd className="font-display text-3xl font-semibold tabular-nums tracking-tight">{value}</dd>
      <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}

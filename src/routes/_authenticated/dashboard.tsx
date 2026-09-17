import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, CalendarClock, Sparkles } from "lucide-react";

import { AttentionCard } from "@/components/home/attention-list";
import { UpdatesPanel } from "@/components/inbox/updates-panel";
import { GmailHomeCard } from "@/components/inbox/gmail-home-card";
import { EmptyState, Section, StageBadge } from "@/components/ui-bits";
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

  if (!isLoading && applications.length === 0) {
    return (
      <div className="space-y-12">
        <header>
          <p className="text-[13px] text-muted-foreground">
            {greeting(t)}, {firstName}
          </p>
          <h1 className="mt-2.5 max-w-2xl font-display text-[30px] font-semibold leading-[1.15] tracking-tight sm:text-[38px]">
            {t("Empecemos por tu primera candidatura")}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {t(
              "Aquí verás cada proceso, sus fechas y lo que necesita tu atención. Todavía no hay nada guardado.",
            )}
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <FirstStep
            step="1"
            title={t("Añade tu primera candidatura")}
            description={t("Guarda el puesto, la empresa y en qué fase estás.")}
            to="/applications"
            cta={t("Añadir candidatura")}
          />
          <FirstStep
            step="2"
            title={t("Sube un CV")}
            description={t("Así sabrás qué versión enviaste a cada proceso.")}
            to="/vault"
            cta={t("Subir CV")}
          />
          <FirstStep
            step="3"
            title={t("Conecta tu correo")}
            description={t("NextRound detecta entrevistas y respuestas, y te pregunta antes de cambiar nada.")}
            to="/settings"
            cta={t("Conectar correo")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero row: greeting + inline pulse */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
            {greeting(t)}, {firstName}
          </p>
          <h1 className="mt-1.5 max-w-2xl font-display text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-[32px]">
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
        <dl className="flex items-center gap-6">
          <InlineMetric label={t("Activos")} value={active.length} />
          <InlineMetric label={t("Entrevistas")} value={interviewsThisWeek} />
          <InlineMetric label={t("Ofertas")} value={offers} accent={offers > 0} />
          <InlineMetric label={t("Totales")} value={applications.length} />
        </dl>
      </header>

      {/* Above the fold: atención + correo, side by side */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-7">
          <h2 className="font-display text-[15px] font-semibold tracking-tight">
            {t("Necesitan tu atención")}
          </h2>
          {feed.length === 0 ? (
            <EmptyState
              title={t("Nada pendiente por ahora")}
              description={t("Buen momento para añadir candidaturas nuevas o pulir tu CV.")}
              icon={<Sparkles className="size-5" />}
              action={
                <Button asChild>
                  <Link to="/applications">{t("Ver candidaturas")}</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {feed.map(({ app, action }) => {
                const event = feedEvents.get(app.id);
                return (
                  <AttentionCard key={app.id} app={app} action={action} {...(event ? { event } : {})} />
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3 lg:col-span-5">
          <h2 className="font-display text-[15px] font-semibold tracking-tight">{t("Tu correo")}</h2>
          <GmailHomeCard />
          <UpdatesPanel />
        </section>
      </div>

      {/* Candidaturas activas */}
      <Section
        title={t("Candidaturas activas")}
        {...(active.length > 0 ? { hint: String(active.length) } : {})}
        action={
          <Link
            to="/applications"
            className="inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("Ver todas")} <ArrowUpRight className="size-3.5" />
          </Link>
        }
      >
        {waiting.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Aquí empieza tu próxima oportunidad.")}</p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-border/70 bg-surface">
            {waiting.map(({ app, days }, index) => (
              <li
                key={app.id}
                className={index > 0 ? "border-t border-border/60" : undefined}
              >
                <Link
                  to="/applications/$id"
                  params={{ id: app.id }}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/70"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{app.companies?.name ?? UNKNOWN}</p>
                    <p className="truncate text-xs text-muted-foreground">{app.role_title}</p>
                  </div>
                  <StageBadge stage={app.stage} className="hidden shrink-0 sm:inline-flex" />
                  {days !== null && (
                    <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {t("{n} días", { n: days })}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 4 — Próximos deadlines y entrevistas */}
      <Section
        title={t("Próximamente")}
        action={
          <Link
            to="/calendar"
            className="inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("Calendario")} <ArrowUpRight className="size-3.5" />
          </Link>
        }
      >
        {upcoming.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="size-4" /> {t("Nada agendado todavía.")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {upcoming.map((event) => (
              <li key={event.id} className="flex items-center gap-4 py-3">
                <div className="w-28 shrink-0">
                  <p className="text-[13px] font-medium">{relativeDay(event.starts_at)}</p>
                  <p className="text-[11px] text-muted-foreground">{fmtDateTime(event.starts_at)}</p>
                </div>
                {event.application_id ? (
                  <Link
                    to="/applications/$id"
                    params={{ id: event.application_id }}
                    className="min-w-0 flex-1 truncate text-[13px] transition-colors hover:text-primary"
                  >
                    {event.title}
                  </Link>
                ) : (
                  <p className="min-w-0 flex-1 truncate text-[13px]">{event.title}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 5 — Información secundaria */}
      <section className="space-y-10 border-t border-border/60 pt-10">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          <Metric label={t("Candidaturas totales")} value={applications.length} />
          <Metric label={t("Procesos activos")} value={active.length} />
          <Metric label={t("Entrevistas esta semana")} value={interviewsThisWeek} />
          <Metric label={t("Ofertas")} value={offers} />
        </dl>

        <Section title={t("Actividad reciente")}>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Todavía no hay movimientos.")}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentActivity.map((app) => (
                <li key={app.id} className="flex items-center gap-4 py-3">
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">
                    {app.updated_at ? relativeDay(app.updated_at) : UNKNOWN}
                  </span>
                  <Link
                    to="/applications/$id"
                    params={{ id: app.id }}
                    className="min-w-0 flex-1 truncate text-[13px] transition-colors hover:text-primary"
                  >
                    {app.companies?.name ?? UNKNOWN} · {app.role_title}
                  </Link>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {CLOSED_STAGES.includes(app.stage)
                      ? t(STAGE_META[app.stage].label)
                      : t(STAGE_META[app.stage].short)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Link
          to="/analytics"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
        >
          {t("Ver insights completos")} <ArrowRight className="size-3.5" />
        </Link>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dd className="font-display text-[28px] font-semibold tabular-nums tracking-tight">{value}</dd>
      <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}

function FirstStep({
  step,
  title,
  description,
  to,
  cta,
}: {
  step: string;
  title: string;
  description: string;
  to: "/applications" | "/vault" | "/settings";
  cta: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/70 bg-surface p-5">
      <span className="flex size-6 items-center justify-center rounded-md bg-surface-2 text-[11px] font-semibold text-muted-foreground ring-1 ring-inset ring-border/60">
        {step}
      </span>
      <p className="mt-3 text-[13px] font-medium">{title}</p>
      <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      <Button asChild variant="outline" size="sm" className="mt-4 w-full">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}

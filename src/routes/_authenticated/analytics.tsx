import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Lightbulb, Percent, Timer, Trophy } from "lucide-react";

import { EmptyState, KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { useT } from "@/lib/i18n/provider";
import { useAllApplicationDocuments, useApplications, useDocuments } from "@/lib/api";
import { CLOSED_STAGES, isActive, type ApplicationWithCompany } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Insights — NextRound" },
      {
        name: "description",
        content:
          "Conclusiones accionables sobre tu búsqueda: embudo de conversión, rendimiento por CV, por origen y por sector.",
      },
      { property: "og:title", content: "Insights — NextRound" },
      {
        property: "og:description",
        content: "Qué está funcionando en tu búsqueda de empleo y qué deberías cambiar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

const MIN_SAMPLE = 5;

function hasResponded(app: ApplicationWithCompany) {
  return !["saved", "applied"].includes(app.stage);
}
function reachedInterview(app: ApplicationWithCompany) {
  return ["interview", "technical", "final", "offer", "accepted"].includes(app.stage);
}
function reachedFinal(app: ApplicationWithCompany) {
  return ["final", "offer", "accepted"].includes(app.stage);
}
function gotOffer(app: ApplicationWithCompany) {
  return app.stage === "offer" || app.stage === "accepted";
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
}

function InsightsPage() {
  const t = useT();
  const { data: applications = [] } = useApplications();
  const { data: documents = [] } = useDocuments();
  const { data: appDocs = [] } = useAllApplicationDocuments();

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("Insights")} description={t("Qué está funcionando en tu búsqueda de empleo.")} />
        <EmptyState
          title={t("Aún no hay datos")}
          description={t("Tus conclusiones aparecerán cuando empieces a presentar candidaturas.")}
          icon={<BarChart3 className="size-6" />}
        />
      </div>
    );
  }

  const sent = applications.filter((app) => app.stage !== "saved").length;
  const responded = applications.filter(hasResponded).length;
  const interviews = applications.filter(reachedInterview).length;
  const finals = applications.filter(reachedFinal).length;
  const offers = applications.filter(gotOffer).length;
  const rejected = applications.filter((app) => app.stage === "rejected").length;
  const closed = applications.filter((app) => CLOSED_STAGES.includes(app.stage)).length;

  const responseRate = sent ? Math.round((responded / sent) * 100) : 0;
  const interviewRate = sent ? Math.round((interviews / sent) * 100) : 0;
  const offerRate = sent ? Math.round((offers / sent) * 100) : 0;

  const funnel = [
    { label: t("Enviadas"), count: sent },
    { label: t("Respuestas"), count: responded },
    { label: t("Entrevistas"), count: interviews },
    { label: t("Rondas finales"), count: finals },
    { label: t("Ofertas"), count: offers },
  ];
  const funnelMax = Math.max(1, sent);

  // ---- desgloses ----
  function breakdown(items: ApplicationWithCompany[], key: (a: ApplicationWithCompany) => string) {
    const groups = groupBy(
      items.filter((a) => a.stage !== "saved"),
      key,
    );
    return [...groups.entries()]
      .map(([label, apps]) => {
        const s = apps.length;
        const i = apps.filter(reachedInterview).length;
        return { label, sent: s, interviews: i, rate: s ? Math.round((i / s) * 100) : 0 };
      })
      .sort((a, b) => b.sent - a.sent);
  }

  const bySector = breakdown(applications, (a) => a.companies?.industry?.trim() || t("Sin sector"));
  const byLocation = breakdown(applications, (a) => a.companies?.location?.trim() || t("Sin ubicación"));
  const bySource = breakdown(applications, (a) => a.source?.trim() || t("Sin origen"));
  const byCompany = breakdown(applications, (a) => a.companies?.name?.trim() || t("Sin empresa"));
  const byMonth = breakdown(applications, (a) => {
    if (!a.applied_at) return t("Sin fecha");
    const d = new Date(a.applied_at);
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  });

  // ---- rendimiento por CV ----
  const cvPerformance = documents
    .filter((doc) => doc.kind === "cv")
    .map((doc) => {
      const links = appDocs.filter((ad) => ad.document_id === doc.id);
      const relatedApps = links
        .map((link) => applications.find((a) => a.id === link.application_id))
        .filter((a): a is ApplicationWithCompany => Boolean(a));
      const usedCount = relatedApps.length;
      const interviewCount = relatedApps.filter(reachedInterview).length;
      const rate = usedCount ? Math.round((interviewCount / usedCount) * 100) : 0;
      return { doc, usedCount, interviewCount, rate };
    })
    .filter((entry) => entry.usedCount > 0)
    .sort((a, b) => b.usedCount - a.usedCount);

  // ---- conclusiones honestas ----
  type Insight = { text: string };
  const insights: Insight[] = [];

  const eligibleSources = bySource.filter((s) => s.sent >= MIN_SAMPLE);
  if (eligibleSources.length >= 2) {
    const best = [...eligibleSources].sort((a, b) => b.rate - a.rate)[0];
    const worst = [...eligibleSources].sort((a, b) => a.rate - b.rate)[0];
    if (best.label !== worst.label && worst.rate > 0 && best.rate > worst.rate) {
      const factor = Math.round((best.rate / worst.rate) * 10) / 10;
      insights.push({
        text: t("Las candidaturas por {best} generan {factor}× más entrevistas que {worst}.", {
          best: best.label,
          factor,
          worst: worst.label,
        }),
      });
    } else if (best.rate > 0) {
      insights.push({
        text: t("Tu mejor origen es {best}, con una tasa de entrevista del {rate}%.", {
          best: best.label,
          rate: best.rate,
        }),
      });
    }
  }

  const eligibleCv = cvPerformance.filter((c) => c.usedCount >= MIN_SAMPLE);
  if (eligibleCv.length >= 1) {
    const best = [...eligibleCv].sort((a, b) => b.rate - a.rate)[0];
    insights.push({
      text: t("Tu CV \"{name}\" tiene la mejor tasa de entrevista: {rate}%.", {
        name: best.doc.name,
        rate: best.rate,
      }),
    });
  }

  const eligibleSectors = bySector.filter((s) => s.sent >= MIN_SAMPLE);
  if (eligibleSectors.length >= 2) {
    const best = [...eligibleSectors].sort((a, b) => b.rate - a.rate)[0];
    if (best.rate > 0) {
      insights.push({
        text: t("En {sector} obtienes tu mejor tasa de entrevista: {rate}%.", {
          sector: best.label,
          rate: best.rate,
        }),
      });
    }
  }

  const activeCount = applications.filter((a) => isActive(a.stage)).length;

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("Insights")}
        description={t("Qué está funcionando y dónde deberías ajustar tu estrategia.")}
      />

      <SectionCard
        title={t("Conclusiones")}
        subtitle={t("Solo cuando hay muestra suficiente para ser honestos")}
      >
        {insights.length > 0 ? (
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-violet" />
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t(
              "Todavía no tenemos suficientes candidaturas por grupo (mínimo {min}) para sacar conclusiones fiables. Sigue registrando procesos.",
              { min: MIN_SAMPLE },
            )}
          </p>
        )}
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("Candidaturas")}
          value={applications.length}
          hint={t("{n} activas", { n: activeCount })}
          icon={<BarChart3 className="size-4" />}
        />
        <KpiCard
          label={t("Tasa de respuesta")}
          value={`${responseRate}%`}
          hint={t("{responded} de {sent}", { responded, sent })}
          icon={<Percent className="size-4" />}
        />
        <KpiCard
          label={t("Tasa de entrevista")}
          value={`${interviewRate}%`}
          hint={t("{interviews} procesos", { interviews })}
          icon={<Timer className="size-4" />}
        />
        <KpiCard
          label={t("Tasa de oferta")}
          value={`${offerRate}%`}
          hint={t("{rejected} rechazos · {closed} cerradas", { rejected, closed })}
          icon={<Trophy className="size-4" />}
        />
      </div>

      <SectionCard title={t("Embudo")} subtitle={t("De candidatura enviada a oferta")}>
        <ul className="space-y-4">
          {funnel.map((step) => (
            <li key={step.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{step.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {step.count}
                  {sent ? ` · ${Math.round((step.count / funnelMax) * 100)}%` : ""}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(step.count / funnelMax) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <BreakdownCard title={t("Por sector")} rows={bySector} t={t} />
        <BreakdownCard title={t("Por ubicación")} rows={byLocation} t={t} />
        <BreakdownCard title={t("Por origen")} rows={bySource} t={t} />
        <BreakdownCard title={t("Por empresa")} rows={byCompany} t={t} />
        <BreakdownCard title={t("Por mes")} rows={byMonth} t={t} />

        <SectionCard title={t("Rendimiento por CV")} subtitle={t("Qué versión funciona mejor")}>
          {cvPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("Vincula tus CV a candidaturas desde CV Library para ver su rendimiento aquí.")}
            </p>
          ) : (
            <ul className="space-y-3">
              {cvPerformance.map((entry) => (
                <li key={entry.doc.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{entry.doc.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {entry.interviewCount}/{entry.usedCount} · {entry.rate}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-violet" style={{ width: `${entry.rate}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
  t,
}: {
  title: string;
  rows: { label: string; sent: number; interviews: number; rate: number }[];
  t: (text: string, vars?: Record<string, string | number>) => string;
}) {
  const top = rows.slice(0, 6);
  const max = Math.max(1, ...top.map((r) => r.sent));
  return (
    <SectionCard title={title}>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Sin datos todavía.")}</p>
      ) : (
        <ul className="space-y-3">
          {top.map((row) => (
            <li key={row.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium">{row.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.sent} · {row.rate}% {t("entrevista")}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-info" style={{ width: `${(row.sent / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

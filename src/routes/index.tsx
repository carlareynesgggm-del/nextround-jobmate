import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
  Compass,
  FileText,
  Layers,
  LinkIcon,
  ListChecks,
  Radar,
  Sparkles,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AiDemo } from "@/components/marketing/ai-demo";
import { ProductPreview } from "@/components/marketing/product-preview";
import { useT } from "@/lib/i18n/provider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NextRound — De la candidatura a la oferta" },
      {
        name: "description",
        content:
          "NextRound centraliza cada candidatura, prepara tus entrevistas y pruebas con IA y te dice siempre cuál es tu siguiente paso hasta la oferta.",
      },
      { property: "og:title", content: "NextRound — De la candidatura a la oferta" },
      {
        property: "og:description",
        content:
          "Sigue cada proceso, prepárate con NextRound AI y no vuelvas a perderte una entrevista o un seguimiento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function usePillars() {
  const t = useT();
  return [
    {
      icon: Radar,
      title: t("SEGUIR"),
      body: t(
        "Cada candidatura, CV enviado, portal del candidato, fecha límite y etapa del proceso en un solo sitio.",
      ),
    },
    {
      icon: Sparkles,
      title: t("PREPARAR"),
      body: t(
        "NextRound AI prepara tus entrevistas, pruebas y seguimientos a partir de la oferta y el CV real que enviaste.",
      ),
    },
    {
      icon: Target,
      title: t("CONSEGUIR"),
      body: t("Sabe siempre cuál es tu siguiente paso, hasta llegar a la oferta."),
    },
  ];
}

function useFeatures() {
  const t = useT();
  return [
    {
      icon: Layers,
      title: t("Seguimiento de candidaturas"),
      body: t("Todas tus candidaturas activas, con etapa, empresa y prioridad de un vistazo."),
    },
    {
      icon: ClipboardCheck,
      title: t("Descripción de la oferta guardada"),
      body: t("Guarda el texto exacto de la oferta para volver a leerlo antes de cada entrevista."),
    },
    {
      icon: LinkIcon,
      title: t("Enlace al portal del candidato"),
      body: t("Accede directo al portal de la empresa sin rebuscar en el correo."),
    },
    {
      icon: FileText,
      title: t("Versión de CV enviada"),
      body: t("Recuerda exactamente qué CV mandaste a cada proceso, sin dudarlo nunca más."),
    },
    {
      icon: BookOpenCheck,
      title: t("Cronología del proceso"),
      body: t("Cada llamada, email y cambio de etapa, ordenado y con contexto."),
    },
    {
      icon: Sparkles,
      title: t("Preparación de entrevistas"),
      body: t("Preguntas probables y puntos clave a partir de la oferta y tu experiencia."),
    },
    {
      icon: ListChecks,
      title: t("Preparación de pruebas"),
      body: t("Un plan concreto para cada prueba técnica o de aptitud que tengas por delante."),
    },
    {
      icon: CalendarClock,
      title: t("Calendario y fechas límite"),
      body: t("Entrevistas, pruebas y plazos en una vista mensual que no se te escapa."),
    },
    {
      icon: BellRing,
      title: t("Recordatorios de seguimiento"),
      body: t("Avisos cuando un proceso lleva demasiado tiempo en silencio."),
    },
    {
      icon: BarChart3,
      title: t("Analítica de candidaturas"),
      body: t("Tasa de respuesta, de entrevista y de oferta, por sector, origen y CV."),
    },
    {
      icon: Compass,
      title: t("Copiloto de carrera con IA"),
      body: t("Pregunta qué hacer hoy y recibe una respuesta con prioridades reales."),
    },
  ];
}

function Landing() {
  const t = useT();
  const PILLARS = usePillars();
  const FEATURES = useFeatures();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              N
            </span>
            <span className="font-display text-sm font-semibold">NextRound</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">{t("Entrar")}</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/auth">
                {t("Empieza gratis")} <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="grid-paper pointer-events-none absolute inset-0 opacity-[0.35]" />
          <div className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-xs font-medium text-violet">
              <Sparkles className="size-3.5" /> {t("NextRound — From application to offer.")}
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
              {t("Toda tu búsqueda de empleo, por fin en un solo sitio.")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {t(
                "Controla cada candidatura, recuerda exactamente qué enviaste, no vuelvas a perderte una entrevista o una prueba y sabe siempre qué hacer después.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth">
                  {t("Empieza gratis")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#como-funciona">{t("Ver cómo funciona")}</a>
              </Button>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title}>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-sm font-semibold tracking-[0.14em] text-muted-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border bg-surface-2/60">
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-xs font-medium text-violet">
                <Sparkles className="size-3.5" /> {t("Copiloto de carrera")}
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {t("Conoce NextRound AI")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {t(
                  "Entiende tus procesos reales porque conoce tus candidaturas, tus fechas y los CV que enviaste. Pregúntale qué hacer hoy.",
                )}
              </p>
            </div>
            <div className="mt-10 max-w-2xl">
              <AiDemo />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("Todo lo que necesitas para llevar un proceso serio")}
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            {t("Cada pieza trabaja junto a las demás para que no pierdas ninguna oportunidad.")}
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-2xl border border-border bg-surface p-5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 text-center md:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("La próxima ronda empieza mejor organizada")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">
            {t("Crea tu cuenta con email y empieza a seguir tus procesos en minutos.")}
          </p>
          <Button asChild size="lg" className="mt-7 gap-2">
            <Link to="/auth">
              {t("Empieza gratis")} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground md:flex-row md:px-8">
          <p>{t("NextRound · De la candidatura a la oferta.")}</p>
          <Link to="/auth" className="hover:text-foreground">
            {t("Entrar")}
          </Link>
        </div>
      </footer>
    </div>
  );
}

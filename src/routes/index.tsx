import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckSquare,
  FileText,
  KanbanSquare,
  ShieldCheck,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { STAGE_META } from "@/lib/domain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NextRound — tu búsqueda de empleo, por fin ordenada" },
      {
        name: "description",
        content:
          "NextRound centraliza candidaturas, entrevistas, versiones de CV, notas y tareas en un panel privado. Deja la hoja de cálculo atrás.",
      },
      { property: "og:title", content: "NextRound — tu búsqueda de empleo, por fin ordenada" },
      {
        property: "og:description",
        content:
          "Pipeline visual de candidaturas, calendario de entrevistas, CV Vault y analytics de conversión.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: KanbanSquare,
    title: "Pipeline visual",
    body: "Mueve cada candidatura entre etapas y ve de un vistazo dónde está atascado el proceso.",
  },
  {
    icon: CalendarDays,
    title: "Calendario propio",
    body: "Entrevistas, pruebas técnicas y fechas límite en una vista mensual clara.",
  },
  {
    icon: FileText,
    title: "CV Vault",
    body: "Guarda versiones de tu CV y cartas, y marca la que usas por defecto.",
  },
  {
    icon: StickyNote,
    title: "Notas con contexto",
    body: "Feedback, preguntas y aprendizajes vinculados a la candidatura correcta.",
  },
  {
    icon: CheckSquare,
    title: "Tareas con fecha",
    body: "Divide la preparación en pasos concretos y no dejes nada colgando.",
  },
  {
    icon: BarChart3,
    title: "Analytics honestos",
    body: "Tasa de respuesta, conversión a entrevista y actividad semanal real.",
  },
];

function Landing() {
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
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/auth">
                Empezar gratis <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="grid-paper pointer-events-none absolute inset-0 opacity-[0.35]" />
          <div className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/12 px-3 py-1 text-xs font-medium text-gold-foreground">
              <ShieldCheck className="size-3.5" /> Privado por diseño
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
              Tu búsqueda de empleo, por fin en un solo sitio.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              NextRound reúne candidaturas, entrevistas, versiones de tu CV, notas y tareas en un
              panel que sí entiende cómo se busca trabajo de verdad.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth">
                  Crear mi cuenta <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Ya tengo cuenta</Link>
              </Button>
            </div>

            <div className="mt-14 rounded-2xl border border-border bg-surface p-4 shadow-lift md:p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tu pipeline
              </p>
              <div className="scrollbar-slim mt-4 flex gap-3 overflow-x-auto pb-2">
                {(
                  [
                    ["saved", "Guardadas", 4],
                    ["applied", "Enviadas", 9],
                    ["screening", "Screening", 3],
                    ["interview", "Entrevista", 2],
                    ["technical", "Técnica", 1],
                    ["offer", "Oferta", 1],
                  ] as const
                ).map(([stage, label, count]) => (
                  <div
                    key={stage}
                    className="w-40 shrink-0 rounded-xl border border-border bg-surface-2 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{label}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {Array.from({ length: Math.min(count, 3) }).map((_, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-border bg-surface px-2.5 py-2"
                        >
                          <div className="h-2 w-2/3 rounded bg-foreground/10" />
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className={`size-1.5 rounded-full ${STAGE_META[stage].dot}`} />
                            <div className="h-1.5 w-1/2 rounded bg-foreground/[0.07]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Todo lo que la hoja de cálculo no hace
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Seis piezas que trabajan juntas para que no pierdas ninguna oportunidad por falta de
            seguimiento.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-soft transition-shadow hover:shadow-lift"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border bg-surface-2/60">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3 md:px-8">
            {[
              ["1", "Registra", "Añade la candidatura con puesto, empresa, salario y origen."],
              ["2", "Sigue", "Mueve la etapa, agenda entrevistas y apunta tu próxima acción."],
              ["3", "Aprende", "Revisa tus métricas y ajusta dónde inviertes el esfuerzo."],
            ].map(([step, title, body]) => (
              <div key={step}>
                <span className="font-display text-4xl font-semibold text-gold">{step}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 text-center md:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            La próxima ronda empieza mejor organizada
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">
            Crea tu cuenta con email y empieza a seguir tus procesos en minutos.
          </p>
          <Button asChild size="lg" className="mt-7 gap-2">
            <Link to="/auth">
              Empezar ahora <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground md:flex-row md:px-8">
          <p>NextRound · Tu centro de mando para la búsqueda de empleo.</p>
          <Link to="/auth" className="hover:text-foreground">
            Entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}

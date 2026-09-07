import { Sparkles } from "lucide-react";

import { useT } from "@/lib/i18n/provider";

/** Ejemplo de conversación con NextRound AI para la portada pública. */
export function AiDemo() {
  const t = useT();

  const suggestions = [
    t("Preparar mi entrevista de mañana"),
    t("Redactar un seguimiento"),
    t("Analizar esta oferta"),
    t("¿Qué fechas límite tengo esta semana?"),
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lift">
      <div className="space-y-4 p-5 md:p-6">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {t("¿En qué debería centrarme hoy?")}
          </div>
        </div>
        <div className="flex justify-start gap-2.5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-violet/12 text-violet">
            <Sparkles className="size-3.5" />
          </span>
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-surface-2 px-4 py-2.5 text-sm leading-relaxed">
            {t(
              "Tienes una prueba de Amazon mañana, una entrevista con Revolut el miércoles y LVMH no responde desde hace 14 días. Te recomiendo preparar Amazon primero y hacer seguimiento a LVMH hoy.",
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border bg-surface-2/60 px-5 py-4 md:px-6">
        {suggestions.map((label) => (
          <span
            key={label}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

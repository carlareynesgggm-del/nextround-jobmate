import { CalendarClock, CheckCircle2, Circle, FileText } from "lucide-react";

import { useT } from "@/lib/i18n/provider";

/**
 * Maqueta visual del producto (HTML/CSS puro, sin capturas ni imágenes de terceros)
 * para mostrar en el hero de la portada.
 */
export function ProductPreview() {
  const t = useT();

  const columns = [
    { label: t("Entrevista"), dot: "bg-info", cards: 2 },
    { label: t("Técnica"), dot: "bg-violet", cards: 1 },
    { label: t("Oferta"), dot: "bg-success", cards: 1 },
  ];

  return (
    <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-surface shadow-lift">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-danger/50" />
        <span className="size-2.5 rounded-full bg-warning/50" />
        <span className="size-2.5 rounded-full bg-success/50" />
        <span className="ml-3 text-xs font-medium text-muted-foreground">{t("Tu panel NextRound")}</span>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[1.3fr_1fr] md:p-6">
        <div className="scrollbar-slim flex gap-3 overflow-x-auto pb-1">
          {columns.map((column) => (
            <div key={column.label} className="w-40 shrink-0 rounded-xl border border-border bg-surface-2 p-3">
              <div className="flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${column.dot}`} />
                <span className="text-xs font-medium">{column.label}</span>
              </div>
              <div className="mt-3 space-y-2">
                {Array.from({ length: column.cards }).map((_, index) => (
                  <div key={index} className="rounded-lg border border-border bg-surface px-2.5 py-2">
                    <div className="h-2 w-3/4 rounded bg-foreground/10" />
                    <div className="mt-1.5 h-1.5 w-1/2 rounded bg-foreground/[0.07]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2.5 rounded-xl border border-border bg-surface-2 p-3.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("Próximos pasos")}
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2">
            <CalendarClock className="size-3.5 shrink-0 text-violet" />
            <div className="h-1.5 w-2/3 rounded bg-foreground/[0.08]" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2">
            <FileText className="size-3.5 shrink-0 text-info" />
            <div className="h-1.5 w-1/2 rounded bg-foreground/[0.08]" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2">
            <CheckCircle2 className="size-3.5 shrink-0 text-success" />
            <div className="h-1.5 w-3/5 rounded bg-foreground/[0.08]" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2 opacity-60">
            <Circle className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="h-1.5 w-2/5 rounded bg-foreground/[0.08]" />
          </div>
        </div>
      </div>
    </div>
  );
}

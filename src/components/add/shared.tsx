import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Estilo compartido para inputs nativos (select) dentro del flujo de alta. */
export const fieldClass =
  "h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export function StepProgress({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="mb-1 flex items-center gap-3">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors",
              index < step ? "bg-violet" : "bg-muted",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function ChoiceCard({
  icon,
  title,
  description,
  onClick,
  primary,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
        primary
          ? "border-violet/30 bg-violet/8 hover:bg-violet/12"
          : "border-border bg-surface-2 hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-9 shrink-0 place-content-center rounded-xl",
          primary ? "bg-violet/15 text-violet" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

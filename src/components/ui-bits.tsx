import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { STAGE_META, companyTint, initials, type Stage } from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const t = useT();
  const meta = STAGE_META[stage];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] font-medium",
        meta.tone,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {t(meta.label)}
    </span>
  );
}

export function Pill({
  children,
  className,
  tone,
}: {
  children: ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-[2px] text-[11px] font-medium",
        tone ?? "border-border/70 bg-surface-2 text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CompanyMark({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-7 rounded-lg text-[10px]",
    md: "size-9 rounded-lg text-xs",
    lg: "size-11 rounded-xl text-sm",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-display font-semibold ring-1 ring-inset ring-border/60",
        companyTint(name),
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/** Bordered container. Quiet by default: hairline border, no shadow. */
export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border/70 bg-surface", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-3.5">
          <div>
            {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/**
 * Borderless section: a title row plus content. Used to build airy pages
 * without stacking competing cards.
 */
export function Section({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-display text-[15px] font-semibold tracking-tight">{title}</h2>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  trend,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
      </div>
      <p className="mt-3 font-display text-[28px] font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        {trend && (
          <span className="rounded-md bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-surface px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border/60">
          {icon}
        </div>
      )}
      <h3 className="font-display text-[15px] font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

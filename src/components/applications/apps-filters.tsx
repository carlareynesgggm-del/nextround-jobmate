import { useMemo } from "react";
import { ListFilter, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  APPLICATION_TYPE_OPTIONS,
  QUICK_FILTERS,
  SOURCE_OPTIONS,
  STAGES,
  STAGE_META,
  PRIORITY_LABEL,
  WORK_MODE_LABEL,
  type ApplicationWithCompany,
} from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { AppsSearch, SortKey } from "./types";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "applied_at", label: "Fecha de solicitud" },
  { id: "waiting", label: "Días esperando" },
  { id: "priority", label: "Prioridad" },
  { id: "deadline", label: "Próxima fecha límite" },
  { id: "company", label: "Empresa" },
];

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-surface px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function AppsFilters({
  search,
  onChange,
  applications,
}: {
  search: AppsSearch;
  onChange: (patch: Partial<AppsSearch>) => void;
  applications: ApplicationWithCompany[];
}) {
  const t = useT();

  const companies = useMemo(
    () => Array.from(new Set(applications.map((a) => a.companies?.name).filter(Boolean))) as string[],
    [applications],
  );
  const locations = useMemo(
    () => Array.from(new Set(applications.map((a) => a.location).filter(Boolean))) as string[],
    [applications],
  );
  const countries = useMemo(
    () => Array.from(new Set(applications.map((a) => a.country).filter(Boolean))) as string[],
    [applications],
  );
  const industries = useMemo(
    () => Array.from(new Set(applications.map((a) => a.companies?.industry).filter(Boolean))) as string[],
    [applications],
  );

  const advancedKeys: (keyof AppsSearch)[] = [
    "stage",
    "company",
    "location",
    "country",
    "industry",
    "type",
    "mode",
    "cv",
    "source",
    "priority",
    "appliedFrom",
    "appliedTo",
    "deadlineFrom",
    "deadlineTo",
  ];
  const activeChips = advancedKeys
    .map((key) => ({ key, value: search[key] }))
    .filter((entry) => !!entry.value) as { key: keyof AppsSearch; value: string }[];

  const chipLabel = (key: keyof AppsSearch, value: string) => {
    switch (key) {
      case "stage":
        return STAGE_META[value as keyof typeof STAGE_META]?.label ?? value;
      case "mode":
        return WORK_MODE_LABEL[value as keyof typeof WORK_MODE_LABEL] ?? value;
      case "priority":
        return PRIORITY_LABEL[value] ?? value;
      case "appliedFrom":
        return `${t("Fecha de solicitud")} ≥ ${value}`;
      case "appliedTo":
        return `${t("Fecha de solicitud")} ≤ ${value}`;
      case "deadlineFrom":
        return `${t("Próxima fecha límite")} ≥ ${value}`;
      case "deadlineTo":
        return `${t("Próxima fecha límite")} ≤ ${value}`;
      default:
        return value;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search.q ?? ""}
            onChange={(event) => onChange({ q: event.target.value || undefined })}
            placeholder={t("Buscar por empresa, puesto o ubicación…")}
            className="pl-9"
          />
        </div>

        <select
          value={search.sort ?? "applied_at"}
          onChange={(event) => onChange({ sort: event.target.value as SortKey })}
          aria-label={t("Ordenar por")}
          className={cn(SELECT_CLASS, "w-auto")}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {t(opt.label)}
            </option>
          ))}
        </select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              <ListFilter className="size-4" /> {t("Filtros")}
              {activeChips.length > 0 && (
                <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
                  {activeChips.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(92vw,560px)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">{t("Filtros avanzados")}</h4>
              {activeChips.length > 0 && (
                <button
                  onClick={() =>
                    onChange(
                      Object.fromEntries(advancedKeys.map((key) => [key, undefined])) as Partial<AppsSearch>,
                    )
                  }
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("Limpiar")}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label={t("Etapa")}>
                <select
                  value={search.stage ?? ""}
                  onChange={(e) => onChange({ stage: (e.target.value || undefined) as AppsSearch["stage"] })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("Cualquiera")}</option>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_META[s].label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Empresa")}>
                <select
                  value={search.company ?? ""}
                  onChange={(e) => onChange({ company: e.target.value || undefined })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("Cualquiera")}</option>
                  {companies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Ubicación")}>
                <select
                  value={search.location ?? ""}
                  onChange={(e) => onChange({ location: e.target.value || undefined })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("Cualquiera")}</option>
                  {locations.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("País")}>
                <select
                  value={search.country ?? ""}
                  onChange={(e) => onChange({ country: e.target.value || undefined })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("Cualquiera")}</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Sector")}>
                <select
                  value={search.industry ?? ""}
                  onChange={(e) => onChange({ industry: e.target.value || undefined })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("Cualquiera")}</option>
                  {industries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Tipo de candidatura")}>
                <select
                  value={search.type ?? ""}
                  onChange={(e) => onChange({ type: e.target.value || undefined })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("Cualquiera")}</option>
                  {APPLICATION_TYPE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Modalidad")}>
                <select
                  value={search.mode ?? ""}
                  onChange={(e) => onChange({ mode: (e.target.value || undefined) as AppsSearch["mode"] })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("Cualquiera")}</option>
                  {Object.entries(WORK_MODE_LABEL).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Origen")}>
                <select
                  value={search.source ?? ""}
                  onChange={(e) => onChange({ source: e.target.value || undefined })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("Cualquiera")}</option>
                  {SOURCE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Prioridad")}>
                <select
                  value={search.priority ?? ""}
                  onChange={(e) => onChange({ priority: e.target.value || undefined })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("Cualquiera")}</option>
                  {Object.entries(PRIORITY_LABEL).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Fecha de solicitud")}>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={search.appliedFrom ?? ""}
                    onChange={(e) => onChange({ appliedFrom: e.target.value || undefined })}
                    className={SELECT_CLASS}
                  />
                  <input
                    type="date"
                    value={search.appliedTo ?? ""}
                    onChange={(e) => onChange({ appliedTo: e.target.value || undefined })}
                    className={SELECT_CLASS}
                  />
                </div>
              </Field>
              <Field label={t("Próxima fecha límite")}>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={search.deadlineFrom ?? ""}
                    onChange={(e) => onChange({ deadlineFrom: e.target.value || undefined })}
                    className={SELECT_CLASS}
                  />
                  <input
                    type="date"
                    value={search.deadlineTo ?? ""}
                    onChange={(e) => onChange({ deadlineTo: e.target.value || undefined })}
                    className={SELECT_CLASS}
                  />
                </div>
              </Field>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onChange({ quick: filter.id })}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              (search.quick ?? "all") === filter.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
            )}
          >
            {t(filter.label)}
          </button>
        ))}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map(({ key, value }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground"
            >
              {chipLabel(key, value)}
              <button
                aria-label={t("Limpiar")}
                onClick={() => onChange({ [key]: undefined } as Partial<AppsSearch>)}
                className="rounded-full p-0.5 hover:bg-accent"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            onClick={() =>
              onChange(
                Object.fromEntries(advancedKeys.map((key) => [key, undefined])) as Partial<AppsSearch>,
              )
            }
            className="text-xs font-medium text-primary hover:underline"
          >
            {t("Limpiar filtros")}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

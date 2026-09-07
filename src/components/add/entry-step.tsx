import { useState } from "react";
import { FileEdit, Link2, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyMark, StageBadge } from "@/components/ui-bits";
import { UNKNOWN, type ApplicationWithCompany } from "@/lib/domain";
import { importJob, type JobImportResult } from "@/lib/job-import";
import { useT } from "@/lib/i18n/provider";

import { ChoiceCard } from "./shared";

type Props = {
  savedOpportunities: ApplicationWithCompany[];
  onImported: (result: JobImportResult) => void;
  onManual: () => void;
  onPickSaved: (application: ApplicationWithCompany) => void;
};

export function EntryStep({ savedOpportunities, onImported, onManual, onPickSaved }: Props) {
  const t = useT();
  const [url, setUrl] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    setImporting(true);
    try {
      const result = await importJob(url);
      onImported(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Ese enlace no parece válido."));
    } finally {
      setImporting(false);
    }
  }

  if (showSaved) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setShowSaved(false)}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {t("← Volver")}
        </button>
        {savedOpportunities.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("No tienes oportunidades guardadas todavía.")}
          </p>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {savedOpportunities.map((app) => (
              <button
                key={app.id}
                onClick={() => onPickSaved(app)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3 text-left hover:bg-accent"
              >
                <CompanyMark name={app.companies?.name ?? UNKNOWN} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{app.role_title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {app.companies?.name ?? UNKNOWN}
                  </span>
                </span>
                <StageBadge stage={app.stage} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-violet/30 bg-violet/8 p-4">
        <label htmlFor="import-url" className="flex items-center gap-1.5 text-sm font-medium">
          <Link2 className="size-3.5 text-violet" /> {t("Pega el enlace de la oferta")}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="import-url"
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleImport();
              }
            }}
            placeholder="https://…"
          />
          <Button onClick={() => void handleImport()} disabled={importing} className="gap-1.5 rounded-xl">
            <Sparkles className="size-4" /> {importing ? t("Importando…") : t("Importar oferta")}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("Detectamos empresa, origen y lo que sea visible en el enlace. Podrás revisarlo todo.")}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ChoiceCard
          icon={<FileEdit className="size-4" />}
          title={t("Añadir manualmente")}
          description={t("Sin enlace: rellena tú los datos.")}
          onClick={onManual}
        />
        <ChoiceCard
          icon={<Star className="size-4" />}
          title={t("Desde oportunidad guardada")}
          description={t("Conviértela en candidatura activa.")}
          onClick={() => setShowSaved(true)}
        />
      </div>
    </div>
  );
}

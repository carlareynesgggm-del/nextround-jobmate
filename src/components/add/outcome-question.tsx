import { CheckCircle2, Clock } from "lucide-react";

import { useT } from "@/lib/i18n/provider";

import { ChoiceCard } from "./shared";

export function OutcomeQuestion({ onAnswer }: { onAnswer: (applied: boolean) => void }) {
  const t = useT();
  return (
    <div className="space-y-3 py-2">
      <p className="text-center text-lg font-medium">{t("¿Ya te has presentado?")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <ChoiceCard
          icon={<CheckCircle2 className="size-4" />}
          title={t("Sí, ya envié la candidatura")}
          description={t("Registra cuándo y con qué documentos.")}
          primary
          onClick={() => onAnswer(true)}
        />
        <ChoiceCard
          icon={<Clock className="size-4" />}
          title={t("Todavía no")}
          description={t("Guárdala como oportunidad para más tarde.")}
          onClick={() => onAnswer(false)}
        />
      </div>
    </div>
  );
}

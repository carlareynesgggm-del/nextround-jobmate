import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITY_LABEL, type DocumentRow } from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";

import { fieldClass } from "./shared";
import type { SavedDetails } from "./types";

type Props = {
  details: SavedDetails;
  onChange: (patch: Partial<SavedDetails>) => void;
  deadlineAt: string;
  onDeadlineChange: (value: string) => void;
  cvs: DocumentRow[];
};

export function SavedForm({ details, onChange, deadlineAt, onDeadlineChange, cvs }: Props) {
  const t = useT();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="saved-deadline">{t("Fecha límite de solicitud")}</Label>
        <Input
          id="saved-deadline"
          type="date"
          value={deadlineAt}
          onChange={(event) => onDeadlineChange(event.target.value)}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="saved-priority">{t("Prioridad")}</Label>
        <select
          id="saved-priority"
          value={details.priority}
          onChange={(event) => onChange({ priority: event.target.value })}
          className={`mt-1.5 ${fieldClass}`}
        >
          {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="saved-cv">{t("CV que piensas usar")}</Label>
        <select
          id="saved-cv"
          value={details.cvId}
          onChange={(event) => onChange({ cvId: event.target.value })}
          className={`mt-1.5 ${fieldClass}`}
        >
          <option value="">{t("Decidirlo más tarde")}</option>
          {cvs.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
              {doc.version ? ` · ${doc.version}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="why-interested">{t("¿Por qué te interesa?")}</Label>
        <Textarea
          id="why-interested"
          value={details.whyInterested}
          onChange={(event) => onChange({ whyInterested: event.target.value })}
          rows={2}
          className="mt-1.5"
        />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="application-plan">{t("Plan de solicitud")}</Label>
        <Textarea
          id="application-plan"
          value={details.applicationPlan}
          onChange={(event) => onChange({ applicationPlan: event.target.value })}
          rows={2}
          className="mt-1.5"
          placeholder={t("Cuándo piensas enviarla, qué te falta preparar…")}
        />
      </div>
    </div>
  );
}

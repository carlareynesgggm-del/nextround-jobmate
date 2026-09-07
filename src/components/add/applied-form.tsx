import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PIPELINE_STAGES, SOURCE_OPTIONS, STAGE_META, type DocumentRow, type Stage } from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";

import { fieldClass } from "./shared";
import type { AppliedDetails } from "./types";

type Props = {
  details: AppliedDetails;
  onChange: (patch: Partial<AppliedDetails>) => void;
  source: string;
  onSourceChange: (source: string) => void;
  cvs: DocumentRow[];
  coverLetters: DocumentRow[];
};

const APPLIED_STAGES: Stage[] = PIPELINE_STAGES.filter((stage) => stage !== "saved");

export function AppliedForm({ details, onChange, source, onSourceChange, cvs, coverLetters }: Props) {
  const t = useT();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="applied-at">{t("¿Cuándo te presentaste?")}</Label>
        <Input
          id="applied-at"
          type="date"
          value={details.appliedAt}
          onChange={(event) => onChange({ appliedAt: event.target.value })}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="applied-stage">{t("Etapa actual")}</Label>
        <select
          id="applied-stage"
          value={details.stage}
          onChange={(event) => onChange({ stage: event.target.value as Stage })}
          className={`mt-1.5 ${fieldClass}`}
        >
          {APPLIED_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_META[stage].label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="cv-used">{t("¿Qué CV usaste?")}</Label>
        <select
          id="cv-used"
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

      <div>
        <Label htmlFor="source">{t("¿Cómo te presentaste?")}</Label>
        <select
          id="source"
          value={source}
          onChange={(event) => onSourceChange(event.target.value)}
          className={`mt-1.5 ${fieldClass}`}
        >
          <option value="">{t("Sin especificar")}</option>
          {SOURCE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 sm:col-span-2">
        <Checkbox
          id="cover-letter"
          checked={details.coverLetterSent}
          onCheckedChange={(checked) => onChange({ coverLetterSent: checked === true })}
        />
        <Label htmlFor="cover-letter" className="cursor-pointer font-normal">
          {t("Envié carta de presentación")}
        </Label>
      </div>

      {details.coverLetterSent && (
        <div className="sm:col-span-2">
          <Label htmlFor="cover-letter-doc">{t("Carta de presentación usada")}</Label>
          <select
            id="cover-letter-doc"
            value={details.coverLetterId}
            onChange={(event) => onChange({ coverLetterId: event.target.value })}
            className={`mt-1.5 ${fieldClass}`}
          >
            <option value="">{t("Decidirlo más tarde")}</option>
            {coverLetters.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="sm:col-span-2">
        <Label htmlFor="portal-url">{t("URL del portal del candidato")}</Label>
        <Input
          id="portal-url"
          value={details.candidatePortalUrl}
          onChange={(event) => onChange({ candidatePortalUrl: event.target.value })}
          placeholder="https://…"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="application-ref">{t("Identificador de la candidatura")}</Label>
        <Input
          id="application-ref"
          value={details.applicationRef}
          onChange={(event) => onChange({ applicationRef: event.target.value })}
          placeholder="REF-2024-0451"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="portal-username">{t("Email o usuario de acceso")}</Label>
        <Input
          id="portal-username"
          value={details.portalUsername}
          onChange={(event) => onChange({ portalUsername: event.target.value })}
          placeholder="tucorreo@ejemplo.com"
          className="mt-1.5"
        />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="portal-password-ref">{t("Referencia de la contraseña")}</Label>
        <Input
          id="portal-password-ref"
          value={details.portalPasswordRef}
          onChange={(event) => onChange({ portalPasswordRef: event.target.value })}
          placeholder={t("Guardada en iCloud Passwords")}
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("Nunca guardamos contraseñas: solo una referencia a dónde la tienes.")}
        </p>
      </div>
    </div>
  );
}

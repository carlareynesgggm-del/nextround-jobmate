import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICATION_TYPE_OPTIONS,
  WORK_MODE_LABEL,
  type ApplicationWithCompany,
  type CompanyRow,
  type WorkMode,
} from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";

import { fieldClass } from "./shared";
import { NEW_COMPANY, type FlowDetails } from "./types";

type Props = {
  details: FlowDetails;
  onChange: (patch: Partial<FlowDetails>) => void;
  companies: CompanyRow[];
  duplicate: ApplicationWithCompany | null;
  onOpenDuplicate: (application: ApplicationWithCompany) => void;
  onIgnoreDuplicate: () => void;
  duplicateIgnored: boolean;
};

export function DetailsStep({
  details,
  onChange,
  companies,
  duplicate,
  onOpenDuplicate,
  onIgnoreDuplicate,
  duplicateIgnored,
}: Props) {
  const t = useT();

  return (
    <div className="space-y-4">
      {duplicate && !duplicateIgnored && (
        <div className="flex flex-col gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-gold-foreground">
            <AlertTriangle className="size-4 shrink-0" />
            {t("Posible candidatura duplicada")}
          </span>
          <span className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => onOpenDuplicate(duplicate)}>
              {t("Abrir la existente")}
            </Button>
            <Button size="sm" variant="ghost" onClick={onIgnoreDuplicate}>
              {t("Crear de todos modos")}
            </Button>
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="role">{t("Puesto")}</Label>
          <Input
            id="role"
            autoFocus
            value={details.roleTitle}
            onChange={(event) => onChange({ roleTitle: event.target.value })}
            placeholder="Operations & Logistics Internship"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="company">{t("Empresa")}</Label>
          <select
            id="company"
            value={details.companyId}
            onChange={(event) => onChange({ companyId: event.target.value })}
            className={`mt-1.5 ${fieldClass}`}
          >
            <option value="">{t("Sin empresa")}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
            <option value={NEW_COMPANY}>{t("+ Nueva empresa…")}</option>
          </select>
          {details.companyId === NEW_COMPANY && (
            <Input
              value={details.newCompanyName}
              onChange={(event) => onChange({ newCompanyName: event.target.value })}
              placeholder={t("Nombre de la empresa")}
              className="mt-2"
            />
          )}
        </div>

        <div>
          <Label htmlFor="application-type">{t("Tipo de candidatura")}</Label>
          <select
            id="application-type"
            value={details.applicationType}
            onChange={(event) => onChange({ applicationType: event.target.value })}
            className={`mt-1.5 ${fieldClass}`}
          >
            <option value="">{t("Sin especificar")}</option>
            {APPLICATION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="location">{t("Ubicación")}</Label>
          <Input
            id="location"
            value={details.location}
            onChange={(event) => onChange({ location: event.target.value })}
            placeholder="Madrid"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="country">{t("País")}</Label>
          <Input
            id="country"
            value={details.country}
            onChange={(event) => onChange({ country: event.target.value })}
            placeholder="España"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="mode">{t("Modalidad")}</Label>
          <select
            id="mode"
            value={details.workMode}
            onChange={(event) => onChange({ workMode: event.target.value as WorkMode | "" })}
            className={`mt-1.5 ${fieldClass}`}
          >
            <option value="">{t("Sin definir")}</option>
            {(Object.keys(WORK_MODE_LABEL) as WorkMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {WORK_MODE_LABEL[mode]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="salary-min">{t("Salario mínimo (€)")}</Label>
          <Input
            id="salary-min"
            inputMode="numeric"
            value={details.salaryMin}
            onChange={(event) => onChange({ salaryMin: event.target.value.replace(/\D/g, "") })}
            placeholder="24000"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="salary-max">{t("Salario máximo (€)")}</Label>
          <Input
            id="salary-max"
            inputMode="numeric"
            value={details.salaryMax}
            onChange={(event) => onChange({ salaryMax: event.target.value.replace(/\D/g, "") })}
            placeholder="32000"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="deadline">{t("Fecha límite de solicitud")}</Label>
          <Input
            id="deadline"
            type="date"
            value={details.deadlineAt}
            onChange={(event) => onChange({ deadlineAt: event.target.value })}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="start-date">{t("Fecha de inicio")}</Label>
          <Input
            id="start-date"
            type="date"
            value={details.startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="duration">{t("Duración (meses)")}</Label>
          <Input
            id="duration"
            inputMode="numeric"
            value={details.durationMonths}
            onChange={(event) => onChange({ durationMonths: event.target.value.replace(/\D/g, "") })}
            placeholder="6"
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="url">{t("Enlace a la oferta")}</Label>
          <Input
            id="url"
            value={details.jobUrl}
            onChange={(event) => onChange({ jobUrl: event.target.value })}
            placeholder="https://…"
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">{t("Descripción")}</Label>
          <Textarea
            id="description"
            value={details.description}
            onChange={(event) => onChange({ description: event.target.value })}
            rows={3}
            className="mt-1.5"
            placeholder={t("Equipo, producto, responsabilidades…")}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="requirements">{t("Requisitos")}</Label>
          <Textarea
            id="requirements"
            value={details.requirements}
            onChange={(event) => onChange({ requirements: event.target.value })}
            rows={3}
            className="mt-1.5"
            placeholder={t("Titulación, idiomas, experiencia…")}
          />
        </div>
      </div>
    </div>
  );
}

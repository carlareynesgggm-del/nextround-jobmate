import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompanies, useSaveApplication, useSaveCompany } from "@/lib/api";
import {
  STAGES,
  STAGE_META,
  WORK_MODE_LABEL,
  type ApplicationWithCompany,
  type Stage,
  type WorkMode,
} from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";
import { useRouter } from "@tanstack/react-router";

import { AddApplicationFlow } from "@/components/add/add-application-flow";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: ApplicationWithCompany | null;
};

const NEW_COMPANY = "__new__";

export function ApplicationDialog({ open, onOpenChange, application }: Props) {
  if (!application) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <NewApplicationHeader />
          {open && <AddApplicationFlow onOpenChange={onOpenChange} onOpenExisting={useNavigateToApplication()} />}
        </DialogContent>
      </Dialog>
    );
  }
  return <EditApplicationDialog open={open} onOpenChange={onOpenChange} application={application} />;
}

function NewApplicationHeader() {
  const t = useT();
  return (
    <DialogHeader>
      <DialogTitle className="font-display">{t("Añadir una candidatura")}</DialogTitle>
      <DialogDescription>
        {t("Menos de un minuto: pega el enlace, revisa los datos y listo.")}
      </DialogDescription>
    </DialogHeader>
  );
}

function useNavigateToApplication() {
  const router = useRouter();
  return (id: string) => {
    void router.navigate({ to: "/applications/$id", params: { id } });
  };
}

function EditApplicationDialog({
  open,
  onOpenChange,
  application,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationWithCompany;
}) {
  const t = useT();
  const { data: companies = [] } = useCompanies();
  const saveApplication = useSaveApplication();
  const saveCompany = useSaveCompany();

  const [roleTitle, setRoleTitle] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [newCompany, setNewCompany] = useState("");
  const [stage, setStage] = useState<Stage>("saved");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode | "">("");
  const [source, setSource] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [priority, setPriority] = useState("medium");
  const [excitement, setExcitement] = useState(3);
  const [nextAction, setNextAction] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setRoleTitle(application.role_title ?? "");
    setCompanyId(application.company_id ?? "");
    setNewCompany("");
    setStage(application.stage ?? "saved");
    setLocation(application.location ?? "");
    setWorkMode(application.work_mode ?? "");
    setSource(application.source ?? "");
    setJobUrl(application.job_url ?? "");
    setSalaryMin(application.salary_min ? String(application.salary_min) : "");
    setSalaryMax(application.salary_max ? String(application.salary_max) : "");
    setPriority(application.priority ?? "medium");
    setExcitement(application.excitement ?? 3);
    setNextAction(application.next_action ?? "");
    setNextActionAt(application.next_action_at ?? "");
    setDescription(application.description ?? "");
  }, [open, application]);

  async function submit() {
    if (!roleTitle.trim()) {
      toast.error(t("Escribe el nombre del puesto."));
      return;
    }
    try {
      let finalCompanyId: string | null = companyId || null;
      if (companyId === NEW_COMPANY) {
        if (!newCompany.trim()) {
          toast.error(t("Escribe el nombre de la empresa."));
          return;
        }
        const created = await saveCompany.mutateAsync({ values: { name: newCompany.trim() } });
        finalCompanyId = (created as unknown as { id: string }).id;
      }

      await saveApplication.mutateAsync({
        id: application.id,
        values: {
          role_title: roleTitle.trim(),
          company_id: finalCompanyId,
          stage,
          location: location.trim() || null,
          work_mode: workMode === "" ? null : workMode,
          source: source.trim() || null,
          job_url: jobUrl.trim() || null,
          salary_min: salaryMin ? Number(salaryMin) : null,
          salary_max: salaryMax ? Number(salaryMax) : null,
          priority,
          excitement,
          next_action: nextAction.trim() || null,
          next_action_at: nextActionAt || null,
          description: description.trim() || null,
          ...(stage !== "saved" && !application.applied_at
            ? { applied_at: new Date().toISOString().slice(0, 10) }
            : {}),
        },
      });
      toast.success(t("Candidatura actualizada"));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo guardar"));
    }
  }

  const fieldClass =
    "h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{t("Editar candidatura")}</DialogTitle>
          <DialogDescription>{t("Actualiza los datos del proceso.")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="role">{t("Puesto")}</Label>
            <Input
              id="role"
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="company">{t("Empresa")}</Label>
            <select
              id="company"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
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
            {companyId === NEW_COMPANY && (
              <Input
                value={newCompany}
                onChange={(event) => setNewCompany(event.target.value)}
                placeholder={t("Nombre de la empresa")}
                className="mt-2"
              />
            )}
          </div>

          <div>
            <Label htmlFor="stage">{t("Etapa")}</Label>
            <select
              id="stage"
              value={stage}
              onChange={(event) => setStage(event.target.value as Stage)}
              className={`mt-1.5 ${fieldClass}`}
            >
              {STAGES.map((value) => (
                <option key={value} value={value}>
                  {STAGE_META[value].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="location">{t("Ubicación")}</Label>
            <Input
              id="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="mode">{t("Modalidad")}</Label>
            <select
              id="mode"
              value={workMode}
              onChange={(event) => setWorkMode(event.target.value as WorkMode | "")}
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
              value={salaryMin}
              onChange={(event) => setSalaryMin(event.target.value.replace(/\D/g, ""))}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="salary-max">{t("Salario máximo (€)")}</Label>
            <Input
              id="salary-max"
              inputMode="numeric"
              value={salaryMax}
              onChange={(event) => setSalaryMax(event.target.value.replace(/\D/g, ""))}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="source">{t("Origen")}</Label>
            <Input
              id="source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={t("LinkedIn, referido…")}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="priority">{t("Prioridad")}</Label>
            <select
              id="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className={`mt-1.5 ${fieldClass}`}
            >
              <option value="high">{t("Alta")}</option>
              <option value="medium">{t("Media")}</option>
              <option value="low">{t("Baja")}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="url">{t("Enlace a la oferta")}</Label>
            <Input
              id="url"
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="next-action">{t("Próxima acción")}</Label>
            <Input
              id="next-action"
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="next-date">{t("Fecha de la próxima acción")}</Label>
            <Input
              id="next-date"
              type="date"
              value={nextActionAt}
              onChange={(event) => setNextActionAt(event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label>{t("Interés")}</Label>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setExcitement(value)}
                  aria-label={t("Interés {n} de 5", { n: value })}
                  className={`h-8 flex-1 rounded-xl border text-xs font-medium transition-colors ${
                    excitement >= value
                      ? "border-violet/35 bg-violet/12 text-violet"
                      : "border-border bg-surface-2 text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">{t("Descripción / detalles")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("Cancelar")}
          </Button>
          <Button onClick={submit} disabled={saveApplication.isPending}>
            {t("Guardar cambios")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

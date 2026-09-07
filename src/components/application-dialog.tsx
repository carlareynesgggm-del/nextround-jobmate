import { useEffect, useMemo, useState } from "react";
import { Link2, Sparkles } from "lucide-react";
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
import {
  useCompanies,
  useDocuments,
  useLinkDocument,
  useSaveApplication,
  useSaveCompany,
} from "@/lib/api";
import {
  STAGES,
  STAGE_META,
  WORK_MODE_LABEL,
  type ApplicationRow,
  type ApplicationWithCompany,
  type Stage,
  type WorkMode,
} from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: ApplicationWithCompany | null;
};

const NEW_COMPANY = "__new__";

/** Adivina empresa y origen a partir del dominio del enlace pegado. */
function readJobUrl(url: string, t: (text: string) => string): { company: string; source: string } | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, "");
    const known: Record<string, string> = {
      "linkedin.com": "LinkedIn",
      "indeed.com": "Indeed",
      "glassdoor.com": "Glassdoor",
      "infojobs.net": "InfoJobs",
      "welcometothejungle.com": "Welcome to the Jungle",
      "greenhouse.io": "Greenhouse",
      "lever.co": "Lever",
      "workday.com": "Workday",
    };
    const portal = Object.keys(known).find((key) => host.endsWith(key));
    const base = host.split(".")[0] ?? host;
    const slug = pathname.split("/").filter(Boolean).slice(-1)[0] ?? "";
    return {
      company: portal ? "" : base.charAt(0).toUpperCase() + base.slice(1),
      source: portal ? (known[portal] as string) : t("Web de la empresa"),
    };
  } catch {
    return null;
  }
}

export function ApplicationDialog({ open, onOpenChange, application }: Props) {
  const t = useT();
  const { data: companies = [] } = useCompanies();
  const { data: documents = [] } = useDocuments();
  const saveApplication = useSaveApplication();
  const saveCompany = useSaveCompany();
  const linkDocument = useLinkDocument();

  const [importUrl, setImportUrl] = useState("");
  const [manual, setManual] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [cvId, setCvId] = useState("");

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

  const cvs = useMemo(
    () => documents.filter((doc) => doc.kind === "cv" || doc.kind === "cover_letter"),
    [documents],
  );

  useEffect(() => {
    if (!open) return;
    setImportUrl("");
    setManual(!!application);
    setCreatedId(null);
    setCvId(documents.find((doc) => doc.is_default && doc.kind === "cv")?.id ?? "");
    setRoleTitle(application?.role_title ?? "");
    setCompanyId(application?.company_id ?? "");
    setNewCompany("");
    setStage(application?.stage ?? "saved");
    setLocation(application?.location ?? "");
    setWorkMode(application?.work_mode ?? "");
    setSource(application?.source ?? "");
    setJobUrl(application?.job_url ?? "");
    setSalaryMin(application?.salary_min ? String(application.salary_min) : "");
    setSalaryMax(application?.salary_max ? String(application.salary_max) : "");
    setPriority(application?.priority ?? "medium");
    setExcitement(application?.excitement ?? 3);
    setNextAction(application?.next_action ?? "");
    setNextActionAt(application?.next_action_at ?? "");
    setDescription(application?.description ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, application]);

  function importJob() {
    const parsed = readJobUrl(importUrl.trim(), t);
    if (!parsed) {
      toast.error(t("Ese enlace no parece válido."));
      return;
    }
    setJobUrl(importUrl.trim());
    setSource(parsed.source);
    if (parsed.company) {
      const match = companies.find(
        (company) => company.name.toLowerCase() === parsed.company.toLowerCase(),
      );
      if (match) setCompanyId(match.id);
      else {
        setCompanyId(NEW_COMPANY);
        setNewCompany(parsed.company);
      }
    }
    setManual(true);
    toast.success(t("Oferta importada. Revisa y completa los datos."));
  }

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

      const saved = await saveApplication.mutateAsync({
        ...(application ? { id: application.id } : {}),
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
          ...(stage !== "saved" && !application?.applied_at
            ? { applied_at: new Date().toISOString().slice(0, 10) }
            : {}),
        },
      });
      toast.success(application ? t("Candidatura actualizada") : t("Candidatura creada"));
      if (application) {
        onOpenChange(false);
        return;
      }
      const newId = (saved as unknown as { id?: string })?.id ?? null;
      if (newId && cvs.length > 0) setCreatedId(newId);
      else onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo guardar"));
    }
  }

  const fieldClass =
    "h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

  if (createdId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{t("¿Qué CV usaste?")}</DialogTitle>
            <DialogDescription>
              {t("Vincúlalo y podré comparar qué versión consigue más respuestas.")}
            </DialogDescription>
          </DialogHeader>
          <select value={cvId} onChange={(event) => setCvId(event.target.value)} className={fieldClass}>
            <option value="">{t("Decidirlo más tarde")}</option>
            {cvs.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
                {doc.version ? ` · ${doc.version}` : ""}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("Ahora no")}
            </Button>
            <Button
              onClick={async () => {
                if (cvId) {
                  await linkDocument.mutateAsync({
                    application: { id: createdId } as ApplicationRow,
                    documentId: cvId,
                    role: "cv",
                    submitted: true,
                  });
                  toast.success(t("CV vinculado"));
                }
                onOpenChange(false);
              }}
            >
              {t("Guardar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {application ? t("Editar candidatura") : t("Nueva candidatura")}
          </DialogTitle>
          <DialogDescription>
            {application
              ? t("Actualiza los datos del proceso.")
              : t("Pega el enlace de la oferta y rellenamos lo que podamos.")}
          </DialogDescription>
        </DialogHeader>

        {!application && (
          <div className="rounded-2xl bg-surface-2 p-4">
            <Label htmlFor="import-url" className="flex items-center gap-1.5">
              <Link2 className="size-3.5" /> {t("Pega el enlace de la oferta")}
            </Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="import-url"
                value={importUrl}
                onChange={(event) => setImportUrl(event.target.value)}
                placeholder="https://…"
              />
              <Button onClick={importJob} className="gap-1.5 rounded-xl">
                <Sparkles className="size-4" /> {t("Importar oferta")}
              </Button>
            </div>
            {!manual && (
              <button
                onClick={() => setManual(true)}
                className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                {t("O rellenar los datos a mano")}
              </button>
            )}
          </div>
        )}

        {(manual || application) && (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="role">{t("Puesto")}</Label>
              <Input
                id="role"
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Operations & Logistics Internship"
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
                placeholder="Madrid, ES"
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
                placeholder="24000"
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
                placeholder="32000"
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
                placeholder="https://…"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="next-action">{t("Próxima acción")}</Label>
              <Input
                id="next-action"
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
                placeholder={t("Enviar email de seguimiento")}
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
                placeholder={t("Equipo, producto, requisitos clave…")}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("Cancelar")}
          </Button>
          <Button onClick={submit} disabled={saveApplication.isPending || (!manual && !application)}>
            {application ? t("Guardar cambios") : t("Crear candidatura")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

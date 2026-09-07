import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  useApplications,
  useCompanies,
  useDocuments,
  useLinkDocument,
  useSaveApplication,
  useSaveCompany,
} from "@/lib/api";
import type { ApplicationRow, ApplicationWithCompany } from "@/lib/domain";
import type { JobImportResult } from "@/lib/job-import";
import { useT } from "@/lib/i18n/provider";

import { AppliedForm } from "./applied-form";
import { DetailsStep } from "./details-step";
import { EntryStep } from "./entry-step";
import { OutcomeQuestion } from "./outcome-question";
import { SavedForm } from "./saved-form";
import { StepProgress } from "./shared";
import {
  NEW_COMPANY,
  emptyAppliedDetails,
  emptyFlowDetails,
  emptySavedDetails,
  type AppliedDetails,
  type FlowDetails,
  type SavedDetails,
} from "./types";

type ScreenId = "entry" | "details" | "question" | "applied" | "saved";

export function AddApplicationFlow({
  onOpenChange,
  onOpenExisting,
}: {
  onOpenChange: (open: boolean) => void;
  onOpenExisting: (id: string) => void;
}) {
  const t = useT();
  const { data: applications = [] } = useApplications();
  const { data: companies = [] } = useCompanies();
  const { data: documents = [] } = useDocuments();
  const saveApplication = useSaveApplication();
  const saveCompany = useSaveCompany();
  const linkDocument = useLinkDocument();

  const [screen, setScreen] = useState<ScreenId>("entry");
  const [details, setDetails] = useState<FlowDetails>(emptyFlowDetails());
  const [applied, setApplied] = useState<AppliedDetails>(emptyAppliedDetails());
  const [saved, setSaved] = useState<SavedDetails>(emptySavedDetails());
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [duplicateIgnored, setDuplicateIgnored] = useState(false);
  const [saving, setSaving] = useState(false);

  const cvs = useMemo(() => documents.filter((doc) => doc.kind === "cv"), [documents]);
  const coverLetters = useMemo(
    () => documents.filter((doc) => doc.kind === "cover_letter"),
    [documents],
  );
  const savedOpportunities = useMemo(
    () => applications.filter((app) => app.stage === "saved"),
    [applications],
  );

  const companyName = useMemo(() => {
    if (details.companyId === NEW_COMPANY) return details.newCompanyName;
    return companies.find((company) => company.id === details.companyId)?.name ?? "";
  }, [companies, details.companyId, details.newCompanyName]);

  const duplicate: ApplicationWithCompany | null = useMemo(() => {
    if (!details.roleTitle.trim()) return null;
    const role = details.roleTitle.trim().toLowerCase();
    return (
      applications.find((app) => {
        if (convertingId && app.id === convertingId) return false;
        if (details.externalId && app.job_ref && app.job_ref === details.externalId) return true;
        const sameCompany =
          (companyName && app.companies?.name?.toLowerCase() === companyName.toLowerCase()) ||
          (!companyName && !app.company_id && !details.companyId);
        return sameCompany && app.role_title.trim().toLowerCase() === role;
      }) ?? null
    );
  }, [applications, companyName, convertingId, details.companyId, details.externalId, details.roleTitle]);

  function patchDetails(patch: Partial<FlowDetails>) {
    setDuplicateIgnored(false);
    setDetails((prev) => ({ ...prev, ...patch }));
  }

  function goToDetailsFromImport(result: JobImportResult) {
    const match = result.company
      ? companies.find((c) => c.name.toLowerCase() === result.company!.toLowerCase())
      : undefined;
    setDetails((prev) => ({
      ...prev,
      jobUrl: result.jobUrl,
      source: result.source,
      externalId: result.externalId ?? "",
      roleTitle: result.roleTitle ?? prev.roleTitle,
      companyId: match ? match.id : result.company ? NEW_COMPANY : prev.companyId,
      newCompanyName: match ? "" : (result.company ?? prev.newCompanyName),
    }));
    setScreen("details");
    toast.success(t("Oferta importada. Revisa y completa los datos."));
  }

  function pickSaved(app: ApplicationWithCompany) {
    setConvertingId(app.id);
    setDetails({
      companyId: app.company_id ?? "",
      newCompanyName: "",
      roleTitle: app.role_title,
      location: app.location ?? "",
      country: app.country ?? "",
      description: app.description ?? "",
      requirements: app.jd_requirements ?? "",
      salaryMin: app.salary_min ? String(app.salary_min) : "",
      salaryMax: app.salary_max ? String(app.salary_max) : "",
      deadlineAt: app.deadline_at ?? "",
      startDate: app.start_date ?? "",
      durationMonths: app.duration_months ? String(app.duration_months) : "",
      workMode: app.work_mode ?? "",
      applicationType: app.application_type ?? "",
      jobUrl: app.job_url ?? "",
      source: app.source ?? "",
      externalId: app.job_ref ?? "",
    });
    setScreen("details");
  }

  function baseValues() {
    return {
      role_title: details.roleTitle.trim(),
      location: details.location.trim() || null,
      country: details.country.trim() || null,
      description: details.description.trim() || null,
      jd_requirements: details.requirements.trim() || null,
      salary_min: details.salaryMin ? Number(details.salaryMin) : null,
      salary_max: details.salaryMax ? Number(details.salaryMax) : null,
      deadline_at: details.deadlineAt || null,
      start_date: details.startDate || null,
      duration_months: details.durationMonths ? Number(details.durationMonths) : null,
      work_mode: details.workMode === "" ? null : details.workMode,
      application_type: details.applicationType || null,
      job_url: details.jobUrl.trim() || null,
      job_ref: details.externalId.trim() || null,
    };
  }

  async function resolveCompanyId(): Promise<string | null> {
    if (details.companyId === NEW_COMPANY) {
      if (!details.newCompanyName.trim()) return null;
      const created = await saveCompany.mutateAsync({ values: { name: details.newCompanyName.trim() } });
      return (created as unknown as { id: string }).id;
    }
    return details.companyId || null;
  }

  async function submitApplied() {
    if (!details.roleTitle.trim()) {
      toast.error(t("Escribe el nombre del puesto."));
      return;
    }
    setSaving(true);
    try {
      const companyId = await resolveCompanyId();
      const savedRow = await saveApplication.mutateAsync({
        ...(convertingId ? { id: convertingId } : {}),
        values: {
          ...baseValues(),
          company_id: companyId,
          stage: applied.stage,
          source: details.source.trim() || null,
          applied_at: applied.appliedAt || null,
          candidate_portal_url: applied.candidatePortalUrl.trim() || null,
          application_ref: applied.applicationRef.trim() || null,
          portal_username: applied.portalUsername.trim() || null,
          portal_password_ref: applied.portalPasswordRef.trim() || null,
        },
      });
      const id = convertingId ?? (savedRow as unknown as { id: string }).id;
      if (applied.cvId) {
        await linkDocument.mutateAsync({
          application: { id, user_id: "" } as ApplicationRow,
          documentId: applied.cvId,
          role: "cv",
          submitted: true,
        });
      }
      if (applied.coverLetterSent && applied.coverLetterId) {
        await linkDocument.mutateAsync({
          application: { id, user_id: "" } as ApplicationRow,
          documentId: applied.coverLetterId,
          role: "cover_letter",
          submitted: true,
        });
      }
      toast.success(t("Candidatura creada"));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  async function submitSaved() {
    if (!details.roleTitle.trim()) {
      toast.error(t("Escribe el nombre del puesto."));
      return;
    }
    setSaving(true);
    try {
      const companyId = await resolveCompanyId();
      const savedRow = await saveApplication.mutateAsync({
        ...(convertingId ? { id: convertingId } : {}),
        values: {
          ...baseValues(),
          company_id: companyId,
          stage: "saved",
          source: details.source.trim() || null,
          priority: saved.priority,
          why_interested: saved.whyInterested.trim() || null,
          application_plan: saved.applicationPlan.trim() || null,
        },
      });
      const id = convertingId ?? (savedRow as unknown as { id: string }).id;
      if (saved.cvId) {
        await linkDocument.mutateAsync({
          application: { id, user_id: "" } as ApplicationRow,
          documentId: saved.cvId,
          role: "cv",
          submitted: false,
        });
      }
      toast.success(t("Oportunidad guardada"));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  const steps: ScreenId[] = ["entry", "details", "question", screen === "saved" ? "saved" : "applied"];
  const stepIndex = Math.max(1, steps.indexOf(screen) + 1);

  return (
    <div className="space-y-4">
      {screen !== "entry" && (
        <StepProgress
          step={stepIndex}
          total={4}
          label={t("Paso {n} de {total}", { n: stepIndex, total: 4 })}
        />
      )}

      {screen === "entry" && (
        <EntryStep
          savedOpportunities={savedOpportunities}
          onImported={goToDetailsFromImport}
          onManual={() => setScreen("details")}
          onPickSaved={pickSaved}
        />
      )}

      {screen === "details" && (
        <DetailsStep
          details={details}
          onChange={patchDetails}
          companies={companies}
          duplicate={duplicate}
          duplicateIgnored={duplicateIgnored}
          onIgnoreDuplicate={() => setDuplicateIgnored(true)}
          onOpenDuplicate={(app) => {
            onOpenChange(false);
            onOpenExisting(app.id);
          }}
        />
      )}

      {screen === "question" && <OutcomeQuestion onAnswer={(yes) => setScreen(yes ? "applied" : "saved")} />}

      {screen === "applied" && (
        <AppliedForm
          details={applied}
          onChange={(patch) => setApplied((prev) => ({ ...prev, ...patch }))}
          source={details.source}
          onSourceChange={(source) => setDetails((prev) => ({ ...prev, source }))}
          cvs={cvs}
          coverLetters={coverLetters}
        />
      )}

      {screen === "saved" && (
        <SavedForm
          details={saved}
          onChange={(patch) => setSaved((prev) => ({ ...prev, ...patch }))}
          deadlineAt={details.deadlineAt}
          onDeadlineChange={(value) => setDetails((prev) => ({ ...prev, deadlineAt: value }))}
          cvs={cvs}
        />
      )}

      <DialogFooter>
        {screen !== "entry" && (
          <Button
            variant="ghost"
            onClick={() => {
              if (screen === "details") setScreen("entry");
              else if (screen === "question") setScreen("details");
              else setScreen("question");
            }}
          >
            {t("Atrás")}
          </Button>
        )}
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          {t("Cancelar")}
        </Button>
        {screen === "details" && (
          <Button
            onClick={() => {
              if (!details.roleTitle.trim()) {
                toast.error(t("Escribe el nombre del puesto."));
                return;
              }
              setScreen("question");
            }}
          >
            {t("Continuar")}
          </Button>
        )}
        {screen === "applied" && (
          <Button onClick={() => void submitApplied()} disabled={saving}>
            {saving ? t("Guardando…") : t("Crear candidatura")}
          </Button>
        )}
        {screen === "saved" && (
          <Button onClick={() => void submitSaved()} disabled={saving}>
            {saving ? t("Guardando…") : t("Guardar oportunidad")}
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}

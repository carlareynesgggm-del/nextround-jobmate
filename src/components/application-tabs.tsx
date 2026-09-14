import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Building2,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Pill, SectionCard } from "@/components/ui-bits";
import {
  documentUrl,
  useApplicationDocuments,
  useContacts,
  useDeleteContact,
  useDeleteTimelineEvent,
  useDocuments,
  useLinkDocument,
  useReorderTimelineEvents,
  useSaveApplication,
  useSaveContact,
  useSaveTimelineEvent,
  useTimeline,
  useUnlinkDocument,
  useUpdateApplicationDocument,
} from "@/lib/api";
import {
  APPLICATION_TYPES,
  DOC_KIND_LABEL,
  EMPLOYMENT_TYPES,
  EVENT_KIND_LABEL,
  PROCESS_STATUS_LABEL,
  STAGES,
  STAGE_META,
  processStatusTone,
  type ApplicationWithCompany,
  type ContactRow,
  type EventKind,
  type Stage,
  type TimelineRow,
} from "@/lib/domain";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";

const selectClass =
  "mt-1.5 h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/* ---------------------------- Job Description ---------------------------- */

export function JobDescriptionTab({ application }: { application: ApplicationWithCompany }) {
  const t = useT();
  const save = useSaveApplication();
  const [form, setForm] = useState({
    description: application.description ?? "",
    jd_responsibilities: application.jd_responsibilities ?? "",
    jd_requirements: application.jd_requirements ?? "",
    jd_preferred: application.jd_preferred ?? "",
    jd_skills: (application.jd_skills ?? []).join(", "),
    jd_salary_text: application.jd_salary_text ?? "",
    jd_benefits: application.jd_benefits ?? "",
    job_url: application.job_url ?? "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-5">
      <SectionCard
        title={t("Descripción de la oferta")}
        subtitle={
          application.jd_saved_at
            ? t("Guardada el {date}", { date: fmtDate(application.jd_saved_at) })
            : t("Aún no has guardado la oferta")
        }
        action={
          application.job_url ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={application.job_url} target="_blank" rel="noreferrer">
                {t("Oferta original")} <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-4">
          <Field label={t("Descripción")}>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(event) => set("description")(event.target.value)}
              className="mt-1.5"
              placeholder={t("Pega aquí la oferta completa para conservarla aunque desaparezca.")}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("Responsabilidades")}>
              <Textarea
                rows={5}
                value={form.jd_responsibilities}
                onChange={(event) => set("jd_responsibilities")(event.target.value)}
                className="mt-1.5"
              />
            </Field>
            <Field label={t("Requisitos")}>
              <Textarea
                rows={5}
                value={form.jd_requirements}
                onChange={(event) => set("jd_requirements")(event.target.value)}
                className="mt-1.5"
              />
            </Field>
            <Field label={t("Cualificaciones preferidas")}>
              <Textarea
                rows={4}
                value={form.jd_preferred}
                onChange={(event) => set("jd_preferred")(event.target.value)}
                className="mt-1.5"
              />
            </Field>
            <Field label={t("Beneficios")}>
              <Textarea
                rows={4}
                value={form.jd_benefits}
                onChange={(event) => set("jd_benefits")(event.target.value)}
                className="mt-1.5"
              />
            </Field>
            <Field label={t("Habilidades (separadas por comas)")}>
              <Input
                value={form.jd_skills}
                onChange={(event) => set("jd_skills")(event.target.value)}
                className="mt-1.5"
                placeholder="Figma, Design Systems, Research"
              />
            </Field>
            <Field label={t("Salario indicado en la oferta")}>
              <Input
                value={form.jd_salary_text}
                onChange={(event) => set("jd_salary_text")(event.target.value)}
                className="mt-1.5"
                placeholder="55.000 – 65.000 EUR brutos/año"
              />
            </Field>
            <Field label={t("URL de la oferta original")}>
              <Input
                value={form.job_url}
                onChange={(event) => set("job_url")(event.target.value)}
                className="mt-1.5"
                placeholder="https://…"
              />
            </Field>
          </div>
        </div>
        <Button
          className="mt-4 gap-1.5"
          onClick={async () => {
            await save.mutateAsync({
              id: application.id,
              values: {
                description: form.description || null,
                jd_responsibilities: form.jd_responsibilities || null,
                jd_requirements: form.jd_requirements || null,
                jd_preferred: form.jd_preferred || null,
                jd_benefits: form.jd_benefits || null,
                jd_salary_text: form.jd_salary_text || null,
                job_url: form.job_url || null,
                jd_skills: form.jd_skills
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
                jd_saved_at: new Date().toISOString(),
              },
            });
            toast.success(t("Oferta guardada"));
          }}
        >
          <Save className="size-4" /> {t("Guardar oferta")}
        </Button>
      </SectionCard>

      {(application.jd_skills ?? []).length > 0 && (
        <SectionCard title={t("Habilidades pedidas")}>
          <div className="flex flex-wrap gap-1.5">
            {(application.jd_skills ?? []).map((skill) => (
              <Pill key={skill}>{skill}</Pill>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ------------------------------ Application ------------------------------ */

export function ApplicationInfoTab({ application }: { application: ApplicationWithCompany }) {
  const t = useT();
  const save = useSaveApplication();
  const { data: links = [] } = useApplicationDocuments(application.id);
  const cvLink = links.find((link) => link.role === "cv" || link.documents?.kind === "cv");
  const [form, setForm] = useState({
    applied_at: application.applied_at ?? "",
    application_type: application.application_type ?? "",
    employment_type: application.employment_type ?? "",
    source: application.source ?? "",
    referral_name: application.referral_name ?? "",
    next_action: application.next_action ?? "",
    next_action_at: application.next_action_at ?? "",
    job_url: application.job_url ?? "",
    candidate_portal_url: application.candidate_portal_url ?? "",
    portal_provider: application.portal_provider ?? "",
    portal_username: application.portal_username ?? "",
    portal_password_ref: application.portal_password_ref ?? "",
    portal_notes: application.portal_notes ?? "",
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-5">
      <SectionCard title="Application Information" subtitle={t("Datos del envío de la candidatura")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("Fecha de envío")}>
            <Input
              type="date"
              value={form.applied_at}
              onChange={(event) => set("applied_at")(event.target.value)}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Tipo de candidatura")}>
            <select
              value={form.application_type}
              onChange={(event) => set("application_type")(event.target.value)}
              className={selectClass}
            >
              <option value="">{t("Sin definir")}</option>
              {APPLICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Tipo de empleo")}>
            <select
              value={form.employment_type}
              onChange={(event) => set("employment_type")(event.target.value)}
              className={selectClass}
            >
              <option value="">{t("Sin definir")}</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Origen")}>
            <Input
              value={form.source}
              onChange={(event) => set("source")(event.target.value)}
              className="mt-1.5"
              placeholder={t("LinkedIn, web de la empresa…")}
            />
          </Field>
          <Field label={t("Persona que te refirió")}>
            <Input
              value={form.referral_name}
              onChange={(event) => set("referral_name")(event.target.value)}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("CV enviado")}>
            <p className="mt-2.5 text-sm">
              {cvLink?.documents
                ? `${cvLink.documents.name}${
                    cvLink.documents.version ? ` · ${cvLink.documents.version}` : ""
                  }`
                : t("Sin CV vinculado")}
            </p>
          </Field>
          <Field label={t("Próximo paso")}>
            <Input
              value={form.next_action}
              onChange={(event) => set("next_action")(event.target.value)}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Fecha límite del próximo paso")}>
            <Input
              type="date"
              value={form.next_action_at}
              onChange={(event) => set("next_action_at")(event.target.value)}
              className="mt-1.5"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={t("Links")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("Oferta de empleo")}>
            <Input
              value={form.job_url}
              onChange={(event) => set("job_url")(event.target.value)}
              className="mt-1.5"
              placeholder="https://…"
            />
          </Field>
          <Field label={t("Portal del candidato")}>
            <Input
              value={form.candidate_portal_url}
              onChange={(event) => set("candidate_portal_url")(event.target.value)}
              className="mt-1.5"
              placeholder="https://…"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Portal Access"
        subtitle={t("Nunca guardamos contraseñas: usa una referencia a tu gestor de contraseñas.")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("Proveedor del portal")}>
            <Input
              value={form.portal_provider}
              onChange={(event) => set("portal_provider")(event.target.value)}
              className="mt-1.5"
              placeholder={t("Workday, Greenhouse, Lever…")}
            />
          </Field>
          <Field label={t("Email o usuario")}>
            <Input
              value={form.portal_username}
              onChange={(event) => set("portal_username")(event.target.value)}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Referencia en tu gestor de contraseñas")}>
            <Input
              value={form.portal_password_ref}
              onChange={(event) => set("portal_password_ref")(event.target.value)}
              className="mt-1.5"
              placeholder="1Password › Workday Nexora"
            />
          </Field>
          <Field label={t("Notas del portal")}>
            <Textarea
              rows={3}
              value={form.portal_notes}
              onChange={(event) => set("portal_notes")(event.target.value)}
              className="mt-1.5"
            />
          </Field>
        </div>
      </SectionCard>

      <Button
        className="gap-1.5"
        onClick={async () => {
          await save.mutateAsync({
            id: application.id,
            values: {
              applied_at: form.applied_at || null,
              application_type: form.application_type || null,
              employment_type: form.employment_type || null,
              source: form.source || null,
              referral_name: form.referral_name || null,
              next_action: form.next_action || null,
              next_action_at: form.next_action_at || null,
              job_url: form.job_url || null,
              candidate_portal_url: form.candidate_portal_url || null,
              portal_provider: form.portal_provider || null,
              portal_username: form.portal_username || null,
              portal_password_ref: form.portal_password_ref || null,
              portal_notes: form.portal_notes || null,
            },
          });
          toast.success(t("Candidatura actualizada"));
        }}
      >
        <Save className="size-4" /> {t("Guardar cambios")}
      </Button>
    </div>
  );
}

/* -------------------------------- Documents ------------------------------- */

export function DocumentsTab({ application }: { application: ApplicationWithCompany }) {
  const t = useT();
  const { data: vault = [] } = useDocuments();
  const { data: links = [] } = useApplicationDocuments(application.id);
  const link = useLinkDocument();
  const updateLink = useUpdateApplicationDocument();
  const unlink = useUnlinkDocument();
  const [documentId, setDocumentId] = useState("");
  const [role, setRole] = useState("cv");

  const linkedIds = new Set(links.map((item) => item.document_id));
  const available = vault.filter((doc) => !linkedIds.has(doc.id));

  const open = async (path: string | null) => {
    if (!path) {
      toast.error(t("Este documento no tiene archivo."));
      return;
    }
    const url = await documentUrl(path);
    if (url) window.open(url, "_blank", "noreferrer");
  };

  return (
    <div className="space-y-5">
      <SectionCard title={t("Vincular documento del CV Vault")}>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <select
            value={documentId}
            onChange={(event) => setDocumentId(event.target.value)}
            aria-label={t("Documento")}
            className={selectClass}
          >
            <option value="">{t("Elige un documento…")}</option>
            {available.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
                {doc.version ? ` · ${doc.version}` : ""} ({DOC_KIND_LABEL[doc.kind]})
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            aria-label={t("Papel del documento")}
            className={selectClass}
          >
            <option value="cv">{t("CV enviado")}</option>
            <option value="cover_letter">{t("Carta de presentación")}</option>
            <option value="other">{t("Otro adjunto")}</option>
          </select>
          <Button
            className="mt-1.5 gap-1.5"
            onClick={async () => {
              if (!documentId) {
                toast.error(t("Elige un documento del vault."));
                return;
              }
              await link.mutateAsync({ application, documentId, role });
              setDocumentId("");
              toast.success(t("Documento vinculado"));
            }}
          >
            <Link2 className="size-4" /> {t("Vincular")}
          </Button>
        </div>
      </SectionCard>

      {links.length === 0 ? (
        <EmptyState
          title={t("Sin documentos vinculados")}
          description={t("Vincula el CV y la carta que enviaste para saber siempre qué versión usaste.")}
          icon={<FileText className="size-6" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {links.map((item) => {
            const doc = item.documents;
            const isCv = item.role === "cv" || doc?.kind === "cv";
            const isLetter = item.role === "cover_letter" || doc?.kind === "cover_letter";
            return (
              <SectionCard key={item.document_id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">
                      {doc?.name ?? t("Documento")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc?.version ? t("Versión {version}", { version: doc.version }) + " · " : ""}
                      {doc ? DOC_KIND_LABEL[doc.kind] : "—"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      unlink.mutate({ applicationId: application.id, documentId: item.document_id })
                    }
                    aria-label={t("Desvincular documento")}
                    className="text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {isCv && <Pill tone="bg-primary/10 text-primary border-primary/25">{t("CV")}</Pill>}
                  {isLetter && (
                    <Pill tone="bg-violet/10 text-violet border-violet/25">{t("Carta")}</Pill>
                  )}
                  {item.submitted && (
                    <Pill tone="bg-success/15 text-success border-success/30">
                      <BadgeCheck className="size-3" /> {t("Enviado con esta candidatura")}
                    </Pill>
                  )}
                </div>
                {item.note && <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => open(doc?.storage_path ?? null)}
                  >
                    {t("Abrir")} <ExternalLink className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateLink.mutate({
                        applicationId: application.id,
                        documentId: item.document_id,
                        values: { submitted: !item.submitted },
                      })
                    }
                  >
                    {item.submitted ? t("Marcar como no enviado") : t("Marcar como enviado")}
                  </Button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Process -------------------------------- */

type ProcessForm = {
  title: string;
  stage: string;
  kind: string;
  stage_type: string;
  status: string;
  scheduled_at: string;
  deadline_at: string;
  detail: string;
  outcome: string;
  attachments: string;
  location: string;
  meeting_url: string;
  duration_min: string;
  // interview
  interviewer: string;
  interviewer_role: string;
  interviewer_email: string;
  interviewer_linkedin: string;
  timezone: string;
  questions_asked: string;
  went_well: string;
  went_poorly: string;
  salary_mentioned: string;
  next_steps: string;
  expected_response_at: string;
  // test
  provider: string;
  assessment_url: string;
  instructions: string;
  prep_notes: string;
};

const emptyProcessForm: ProcessForm = {
  title: "",
  stage: "",
  kind: "interview",
  stage_type: "interview",
  status: "scheduled",
  scheduled_at: "",
  deadline_at: "",
  detail: "",
  outcome: "",
  attachments: "",
  location: "",
  meeting_url: "",
  duration_min: "",
  interviewer: "",
  interviewer_role: "",
  interviewer_email: "",
  interviewer_linkedin: "",
  timezone: "",
  questions_asked: "",
  went_well: "",
  went_poorly: "",
  salary_mentioned: "",
  next_steps: "",
  expected_response_at: "",
  provider: "",
  assessment_url: "",
  instructions: "",
  prep_notes: "",
};

function rowToForm(row: TimelineRow): ProcessForm {
  return {
    title: row.title,
    stage: row.stage ?? row.to_stage ?? "",
    kind: row.kind ?? "interview",
    stage_type: row.stage_type ?? row.kind ?? "interview",
    status: row.status ?? "scheduled",
    scheduled_at: toLocalInput(row.scheduled_at ?? row.occurred_at),
    deadline_at: toLocalInput(row.deadline_at),
    detail: row.detail ?? "",
    outcome: row.outcome ?? "",
    attachments: (row.attachments ?? []).join(", "),
    location: row.location ?? "",
    meeting_url: row.meeting_url ?? "",
    duration_min: row.duration_min?.toString() ?? "",
    interviewer: row.interviewer ?? "",
    interviewer_role: row.interviewer_role ?? "",
    interviewer_email: row.interviewer_email ?? "",
    interviewer_linkedin: row.interviewer_linkedin ?? "",
    timezone: row.timezone ?? "",
    questions_asked: row.questions_asked ?? "",
    went_well: row.went_well ?? "",
    went_poorly: row.went_poorly ?? "",
    salary_mentioned: row.salary_mentioned ?? "",
    next_steps: row.next_steps ?? "",
    expected_response_at: toLocalInput(row.expected_response_at),
    provider: row.provider ?? "",
    assessment_url: row.assessment_url ?? "",
    instructions: row.instructions ?? "",
    prep_notes: row.prep_notes ?? "",
  };
}

function buildPrepPrompt(application: ApplicationWithCompany, form: ProcessForm): string {
  const company = application.companies?.name ?? "la empresa";
  if (form.stage_type === "test") {
    return `Ayúdame a preparar la prueba técnica "${form.title}" para el puesto de ${application.role_title} en ${company}${
      form.provider ? ` (proveedor: ${form.provider})` : ""
    }. ${form.instructions ? `Instrucciones: ${form.instructions}.` : ""}`.trim();
  }
  return `Ayúdame a preparar la entrevista "${form.title}" para el puesto de ${application.role_title} en ${company}${
    form.interviewer ? ` con ${form.interviewer}${form.interviewer_role ? ` (${form.interviewer_role})` : ""}` : ""
  }.`.trim();
}

export function ProcessTab({ application }: { application: ApplicationWithCompany }) {
  const t = useT();
  const { data: timeline = [] } = useTimeline(application.id);
  const saveEvent = useSaveTimelineEvent();
  const deleteEvent = useDeleteTimelineEvent();
  const reorder = useReorderTimelineEvents();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ProcessForm>(emptyProcessForm);

  const ordered = useMemo(
    () =>
      [...timeline].sort((a, b) => {
        if ((a.position ?? 0) !== (b.position ?? 0)) return (a.position ?? 0) - (b.position ?? 0);
        const at = new Date(a.scheduled_at ?? a.occurred_at).getTime();
        const bt = new Date(b.scheduled_at ?? b.occurred_at).getTime();
        return at - bt;
      }),
    [timeline],
  );

  const prepareWithAi = (targetForm: ProcessForm) => {
    window.dispatchEvent(
      new CustomEvent("nextround:ai", {
        detail: {
          applicationId: application.id,
          prompt: buildPrepPrompt(application, targetForm),
        },
      }),
    );
  };

  const submit = async (id?: string) => {
    if (!form.title.trim()) {
      toast.error(t("Pon un título a la etapa."));
      return;
    }
    const scheduled = form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null;
    await saveEvent.mutateAsync({
      ...(id ? { id } : {}),
      application,

      values: {
        title: form.title.trim(),
        stage: (form.stage || null) as Stage | null,
        kind: (form.stage_type || form.kind || null) as EventKind | null,
        stage_type: form.stage_type || null,
        status: form.status,
        scheduled_at: scheduled,
        occurred_at: scheduled ?? new Date().toISOString(),
        deadline_at: form.deadline_at ? new Date(form.deadline_at).toISOString() : null,
        detail: form.detail || null,
        outcome: form.outcome || null,
        location: form.location || null,
        meeting_url: form.meeting_url || null,
        duration_min: form.duration_min ? Number(form.duration_min) : null,
        interviewer: form.interviewer || null,
        interviewer_role: form.interviewer_role || null,
        interviewer_email: form.interviewer_email || null,
        interviewer_linkedin: form.interviewer_linkedin || null,
        timezone: form.timezone || null,
        questions_asked: form.questions_asked || null,
        went_well: form.went_well || null,
        went_poorly: form.went_poorly || null,
        salary_mentioned: form.salary_mentioned || null,
        next_steps: form.next_steps || null,
        expected_response_at: form.expected_response_at
          ? new Date(form.expected_response_at).toISOString()
          : null,
        provider: form.provider || null,
        assessment_url: form.assessment_url || null,
        instructions: form.instructions || null,
        prep_notes: form.prep_notes || null,
        attachments: form.attachments
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        ...(id ? {} : { position: ordered.length }),
      },
    });
    setForm(emptyProcessForm);
    setAdding(false);
    setEditingId(null);
    toast.success(id ? t("Etapa actualizada") : t("Etapa añadida"));
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...ordered];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    next[index] = next[target]!;
    next[target] = a;
    reorder.mutate({ applicationId: application.id, ordered: next });
  };

  const formCard = (id?: string) => (
    <SectionCard title={id ? t("Editar etapa") : t("Nueva etapa del proceso")}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("Título")}>
          <Input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="mt-1.5"
            placeholder={t("Entrevista con hiring manager")}
          />
        </Field>
        <Field label={t("Etapa del pipeline")}>
          <select
            value={form.stage}
            onChange={(event) => setForm({ ...form, stage: event.target.value })}
            className={selectClass}
          >
            <option value="">{t("Sin etapa")}</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_META[stage].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Tipo de hito")}>
          <select
            value={form.stage_type}
            onChange={(event) =>
              setForm({ ...form, stage_type: event.target.value, kind: event.target.value })
            }
            className={selectClass}
          >
            {(Object.keys(EVENT_KIND_LABEL) as EventKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {EVENT_KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Estado")}>
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            className={selectClass}
          >
            {Object.entries(PROCESS_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Fecha y hora")}>
          <Input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })}
            className="mt-1.5"
          />
        </Field>
        <Field label={t("Fecha límite")}>
          <Input
            type="datetime-local"
            value={form.deadline_at}
            onChange={(event) => setForm({ ...form, deadline_at: event.target.value })}
            className="mt-1.5"
          />
        </Field>
        <Field label={t("Duración (minutos)")}>
          <Input
            type="number"
            value={form.duration_min}
            onChange={(event) => setForm({ ...form, duration_min: event.target.value })}
            className="mt-1.5"
          />
        </Field>
        <Field label={t("Ubicación / modalidad")}>
          <Input
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            className="mt-1.5"
          />
        </Field>
        <Field label={t("Enlace de la reunión")}>
          <Input
            value={form.meeting_url}
            onChange={(event) => setForm({ ...form, meeting_url: event.target.value })}
            className="mt-1.5"
            placeholder="https://…"
          />
        </Field>
      </div>

      {form.stage_type === "test" ? (
        <div className="mt-5 grid gap-4 rounded-xl border border-border bg-surface-2/40 p-4 md:grid-cols-2">
          <p className="font-display text-sm font-semibold md:col-span-2">{t("Detalles de la prueba")}</p>
          <Field label={t("Proveedor de la prueba")}>
            <Input
              value={form.provider}
              onChange={(event) => setForm({ ...form, provider: event.target.value })}
              className="mt-1.5"
              placeholder="HackerRank, Codility…"
            />
          </Field>
          <Field label={t("Enlace de la prueba")}>
            <Input
              value={form.assessment_url}
              onChange={(event) => setForm({ ...form, assessment_url: event.target.value })}
              className="mt-1.5"
              placeholder="https://…"
            />
          </Field>
          <Field label={t("Instrucciones")}>
            <Textarea
              rows={3}
              value={form.instructions}
              onChange={(event) => setForm({ ...form, instructions: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Notas de preparación")}>
            <Textarea
              rows={3}
              value={form.prep_notes}
              onChange={(event) => setForm({ ...form, prep_notes: event.target.value })}
              className="mt-1.5"
            />
          </Field>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 rounded-xl border border-border bg-surface-2/40 p-4 md:grid-cols-2">
          <p className="font-display text-sm font-semibold md:col-span-2">{t("Detalles de la entrevista")}</p>
          <Field label={t("Entrevistador")}>
            <Input
              value={form.interviewer}
              onChange={(event) => setForm({ ...form, interviewer: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Puesto del entrevistador")}>
            <Input
              value={form.interviewer_role}
              onChange={(event) => setForm({ ...form, interviewer_role: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Email del entrevistador")}>
            <Input
              value={form.interviewer_email}
              onChange={(event) => setForm({ ...form, interviewer_email: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("LinkedIn del entrevistador")}>
            <Input
              value={form.interviewer_linkedin}
              onChange={(event) => setForm({ ...form, interviewer_linkedin: event.target.value })}
              className="mt-1.5"
              placeholder="https://linkedin.com/in/…"
            />
          </Field>
          <Field label={t("Zona horaria")}>
            <Input
              value={form.timezone}
              onChange={(event) => setForm({ ...form, timezone: event.target.value })}
              className="mt-1.5"
              placeholder="Europe/Madrid"
            />
          </Field>
          <p className="font-display text-sm font-semibold md:col-span-2">{t("Notas posteriores")}</p>
          <Field label={t("Preguntas realizadas")}>
            <Textarea
              rows={3}
              value={form.questions_asked}
              onChange={(event) => setForm({ ...form, questions_asked: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Qué fue bien")}>
            <Textarea
              rows={3}
              value={form.went_well}
              onChange={(event) => setForm({ ...form, went_well: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Qué fue mal")}>
            <Textarea
              rows={3}
              value={form.went_poorly}
              onChange={(event) => setForm({ ...form, went_poorly: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Salario mencionado")}>
            <Input
              value={form.salary_mentioned}
              onChange={(event) => setForm({ ...form, salary_mentioned: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Próximos pasos")}>
            <Textarea
              rows={2}
              value={form.next_steps}
              onChange={(event) => setForm({ ...form, next_steps: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Fecha esperada de respuesta")}>
            <Input
              type="datetime-local"
              value={form.expected_response_at}
              onChange={(event) => setForm({ ...form, expected_response_at: event.target.value })}
              className="mt-1.5"
            />
          </Field>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label={t("Resultado")}>
          <Input
            value={form.outcome}
            onChange={(event) => setForm({ ...form, outcome: event.target.value })}
            className="mt-1.5"
            placeholder={t("Pasas a la siguiente ronda")}
          />
        </Field>
        <Field label={t("Notas generales")}>
          <Textarea
            rows={3}
            value={form.detail}
            onChange={(event) => setForm({ ...form, detail: event.target.value })}
            className="mt-1.5"
          />
        </Field>
        <Field label={t("Adjuntos (nombres separados por comas)")}>
          <Input
            value={form.attachments}
            onChange={(event) => setForm({ ...form, attachments: event.target.value })}
            className="mt-1.5"
            placeholder="Caso práctico.pdf, Feedback.txt"
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button className="gap-1.5" onClick={() => submit(id)}>
          <Save className="size-4" /> {t("Guardar")}
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={() => prepareWithAi(form)}>
          <Sparkles className="size-4" /> {t("Preparar con IA")}
        </Button>
        <Button
          variant="ghost"
          className="gap-1.5"
          onClick={() => {
            setAdding(false);
            setEditingId(null);
            setForm(emptyProcessForm);
          }}
        >
          <X className="size-4" /> {t("Cancelar")}
        </Button>
      </div>
    </SectionCard>
  );

  return (
    <div className="space-y-5">
      {adding ? (
        formCard()
      ) : (
        <Button
          className="gap-1.5"
          onClick={() => {
            setForm(emptyProcessForm);
            setEditingId(null);
            setAdding(true);
          }}
        >
          <Plus className="size-4" /> {t("Añadir etapa")}
        </Button>
      )}

      {ordered.length === 0 ? (
        <EmptyState
          title={t("Proceso sin etapas")}
          description={t("Registra cada entrevista, prueba y respuesta para ver el recorrido completo.")}
        />
      ) : (
        <ol className="relative space-y-4 pl-6">
          <span
            className="absolute left-[7px] top-2 bottom-2 w-px bg-border"
            aria-hidden
          />
          {ordered.map((row, index) => (
            <li key={row.id} className="relative">
              <span
                className="absolute -left-6 top-5 size-3.5 rounded-full border-2 border-surface bg-primary"
                aria-hidden
              />
              {editingId === row.id ? (
                formCard(row.id)
              ) : (
                <SectionCard>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold">{row.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {fmtDateTime(row.scheduled_at ?? row.occurred_at)}
                        {row.deadline_at ? ` · ${t("límite {date}", { date: fmtDateTime(row.deadline_at) })}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => prepareWithAi(rowToForm(row))}
                        aria-label={t("Preparar con IA")}
                        className="text-muted-foreground hover:text-violet"
                      >
                        <Sparkles className="size-3.5" />
                      </button>
                      <button
                        onClick={() => move(index, -1)}
                        aria-label={t("Subir etapa")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        onClick={() => move(index, 1)}
                        aria-label={t("Bajar etapa")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setForm(rowToForm(row));
                          setAdding(false);
                          setEditingId(row.id);
                        }}
                        aria-label={t("Editar etapa")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          deleteEvent.mutate({ id: row.id, applicationId: application.id })
                        }
                        aria-label={t("Eliminar etapa")}
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {row.stage && <Pill tone={STAGE_META[row.stage].tone}>{STAGE_META[row.stage].label}</Pill>}
                    {row.kind && <Pill>{EVENT_KIND_LABEL[row.kind]}</Pill>}
                    <Pill tone={processStatusTone(row.status ?? "done")}>
                      {PROCESS_STATUS_LABEL[row.status ?? "done"] ?? row.status}
                    </Pill>
                    {row.interviewer && <Pill>{t("Con {name}", { name: row.interviewer })}</Pill>}
                    {row.provider && <Pill>{row.provider}</Pill>}
                  </div>
                  {(row.meeting_url || row.assessment_url) && (
                    <p className="mt-3 text-sm">
                      <a
                        href={row.meeting_url ?? row.assessment_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-violet hover:underline"
                      >
                        <Link2 className="size-3.5" /> {t("Abrir enlace")}
                      </a>
                    </p>
                  )}
                  {row.detail && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{row.detail}</p>
                  )}
                  {row.outcome && (
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">{t("Resultado: ")}</span>
                      {row.outcome}
                    </p>
                  )}
                  {row.went_well && (
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">{t("Qué fue bien: ")}</span>
                      {row.went_well}
                    </p>
                  )}
                  {row.went_poorly && (
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">{t("Qué fue mal: ")}</span>
                      {row.went_poorly}
                    </p>
                  )}
                  {row.next_steps && (
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">{t("Próximos pasos: ")}</span>
                      {row.next_steps}
                    </p>
                  )}
                  {(row.attachments ?? []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(row.attachments ?? []).map((file) => (
                        <Pill key={file}>
                          <FileText className="size-3" /> {file}
                        </Pill>
                      ))}
                    </div>
                  )}
                </SectionCard>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}



/* -------------------------------- Contacts -------------------------------- */

export function ContactsTab({ application }: { application: ApplicationWithCompany }) {
  const t = useT();
  const { data: contacts = [] } = useContacts();
  const saveContact = useSaveContact();
  const deleteContact = useDeleteContact();
  const [form, setForm] = useState({
    name: "",
    role_title: "",
    email: "",
    phone: "",
    linkedin: "",
    notes: "",
  });

  const mine = contacts.filter(
    (contact) =>
      contact.application_id === application.id ||
      (!contact.application_id && contact.company_id && contact.company_id === application.company_id),
  );

  return (
    <div className="space-y-5">
      <SectionCard title={t("Nuevo contacto de este proceso")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("Nombre")}>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Puesto")}>
            <Input
              value={form.role_title}
              onChange={(event) => setForm({ ...form, role_title: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Email")}>
            <Input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Teléfono")}>
            <Input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("LinkedIn")}>
            <Input
              value={form.linkedin}
              onChange={(event) => setForm({ ...form, linkedin: event.target.value })}
              className="mt-1.5"
            />
          </Field>
          <Field label={t("Notas")}>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              className="mt-1.5"
            />
          </Field>
        </div>
        <Button
          className="mt-4 gap-1.5"
          onClick={async () => {
            if (!form.name.trim()) {
              toast.error(t("Añade el nombre del contacto."));
              return;
            }
            await saveContact.mutateAsync({
              values: {
                name: form.name.trim(),
                role_title: form.role_title || null,
                email: form.email || null,
                phone: form.phone || null,
                linkedin: form.linkedin || null,
                notes: form.notes || null,
                application_id: application.id,
                company_id: application.company_id,
              },
            });
            setForm({ name: "", role_title: "", email: "", phone: "", linkedin: "", notes: "" });
            toast.success(t("Contacto guardado"));
          }}
        >
          <Plus className="size-4" /> {t("Guardar contacto")}
        </Button>
      </SectionCard>

      {mine.length === 0 ? (
        <EmptyState
          title={t("Sin contactos")}
          description={t("Guarda a quien te entrevista o te refiere para tener su ficha a mano.")}
          icon={<Building2 className="size-6" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mine.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onDelete={() => deleteContact.mutate(contact.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactCard({ contact, onDelete }: { contact: ContactRow; onDelete: () => void }) {
  const t = useT();
  return (
    <SectionCard>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold">{contact.name}</p>
          <p className="text-xs text-muted-foreground">{contact.role_title ?? t("Sin puesto")}</p>
        </div>
        <button
          onClick={onDelete}
          aria-label={t("Eliminar contacto")}
          className="text-muted-foreground hover:text-danger"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            <Mail className="size-3.5" /> {contact.email}
          </a>
        )}
        {contact.phone && (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="size-3.5" /> {contact.phone}
          </p>
        )}
        {contact.linkedin && (
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" /> LinkedIn
          </a>
        )}
      </div>
      {contact.notes && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{contact.notes}</p>
      )}
    </SectionCard>
  );
}

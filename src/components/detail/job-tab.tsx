import { useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard, Pill } from "@/components/ui-bits";
import { useSaveApplication } from "@/lib/api";
import { UNKNOWN, type ApplicationWithCompany } from "@/lib/domain";
import { fmtLongDate } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export function JobTab({ application }: { application: ApplicationWithCompany }) {
  const t = useT();
  const save = useSaveApplication();
  const [form, setForm] = useState({
    role_title: application.role_title ?? "",
    company: application.companies?.name ?? "",
    location: application.location ?? "",
    job_url: application.job_url ?? "",
    job_ref: application.job_ref ?? "",
    jd_responsibilities: application.jd_responsibilities ?? "",
    jd_requirements: application.jd_requirements ?? "",
    jd_preferred: application.jd_preferred ?? "",
    jd_skills: (application.jd_skills ?? []).join(", "),
    language_requirements: application.language_requirements ?? "",
    jd_benefits: application.jd_benefits ?? "",
    jd_salary_text: application.jd_salary_text ?? "",
    work_authorisation: application.work_authorisation ?? "",
    start_date: application.start_date ?? "",
    duration_months: application.duration_months?.toString() ?? "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [linkFailed, setLinkFailed] = useState(false);

  return (
    <div className="space-y-6">
      <SectionCard
        subtitle={
          application.jd_saved_at
            ? t("Guardada el {date}", { date: fmtLongDate(application.jd_saved_at) })
            : t("Aún no has guardado una copia de esta oferta")
        }
        action={
          application.job_url ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a
                href={application.job_url}
                target="_blank"
                rel="noreferrer"
                onError={() => setLinkFailed(true)}
              >
                {t("Ver anuncio original")} <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : undefined
        }
      >
        {!application.job_url || linkFailed ? (
          <p className="text-sm text-muted-foreground">
            {t("El anuncio original ya no está disponible. Tu copia guardada se conserva.")}
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label={t("Título del puesto")}>
            <Input value={form.role_title} onChange={(e) => set("role_title")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("Empresa")}>
            <Input value={form.company} disabled className="mt-1.5" />
          </Field>
          <Field label={t("Ubicación")}>
            <Input value={form.location} onChange={(e) => set("location")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("URL original")}>
            <Input value={form.job_url} onChange={(e) => set("job_url")(e.target.value)} className="mt-1.5" placeholder="https://…" />
          </Field>
          <Field label={t("Identificador de la oferta")}>
            <Input value={form.job_ref} onChange={(e) => set("job_ref")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("Fecha de inicio")}>
            <Input type="date" value={form.start_date} onChange={(e) => set("start_date")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("Duración (meses)")}>
            <Input type="number" value={form.duration_months} onChange={(e) => set("duration_months")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("Información de visado / autorización")}>
            <Input value={form.work_authorisation} onChange={(e) => set("work_authorisation")(e.target.value)} className="mt-1.5" />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label={t("Responsabilidades")}>
            <Textarea rows={5} value={form.jd_responsibilities} onChange={(e) => set("jd_responsibilities")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("Requisitos")}>
            <Textarea rows={5} value={form.jd_requirements} onChange={(e) => set("jd_requirements")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("Cualificaciones deseables")}>
            <Textarea rows={4} value={form.jd_preferred} onChange={(e) => set("jd_preferred")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("Beneficios")}>
            <Textarea rows={4} value={form.jd_benefits} onChange={(e) => set("jd_benefits")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("Habilidades (separadas por comas)")}>
            <Input value={form.jd_skills} onChange={(e) => set("jd_skills")(e.target.value)} className="mt-1.5" placeholder="Excel, SQL, Inglés C1" />
          </Field>
          <Field label={t("Idiomas requeridos")}>
            <Input value={form.language_requirements} onChange={(e) => set("language_requirements")(e.target.value)} className="mt-1.5" />
          </Field>
          <Field label={t("Salario / condiciones indicadas en la oferta")}>
            <Input value={form.jd_salary_text} onChange={(e) => set("jd_salary_text")(e.target.value)} className="mt-1.5" />
          </Field>
        </div>

        <Button
          className="mt-5 gap-1.5"
          onClick={async () => {
            await save.mutateAsync({
              id: application.id,
              values: {
                role_title: form.role_title || application.role_title,
                location: form.location || null,
                job_url: form.job_url || null,
                job_ref: form.job_ref || null,
                jd_responsibilities: form.jd_responsibilities || null,
                jd_requirements: form.jd_requirements || null,
                jd_preferred: form.jd_preferred || null,
                jd_benefits: form.jd_benefits || null,
                jd_salary_text: form.jd_salary_text || null,
                language_requirements: form.language_requirements || null,
                work_authorisation: form.work_authorisation || null,
                start_date: form.start_date || null,
                duration_months: form.duration_months ? Number(form.duration_months) : null,
                jd_skills: form.jd_skills
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
                jd_saved_at: application.jd_saved_at ?? new Date().toISOString(),
              },
            });
            toast.success(t("Oferta guardada"));
          }}
        >
          <Save className="size-4" /> {t("Guardar copia")}
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

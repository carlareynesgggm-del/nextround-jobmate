import { useState } from "react";
import { Save, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveApplication, useApplicationDocuments } from "@/lib/api";
import {
  OFFER_DECISIONS,
  PRIORITY_LABEL,
  UNKNOWN,
  WORK_MODE_LABEL,
  formatSalary,
  type ApplicationWithCompany,
} from "@/lib/domain";
import { daysSinceApplied } from "@/lib/alerts";
import { fmtDate, relativeDay, toDateInput } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
      <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  );
}

function Row({ label, value, href }: { label: string; value: React.ReactNode; href?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-violet hover:underline">
            {value}
          </a>
        ) : (
          value ?? UNKNOWN
        )}
      </dd>
    </div>
  );
}

export function OverviewTab({ application }: { application: ApplicationWithCompany }) {
  const t = useT();
  const { data: links = [] } = useApplicationDocuments(application.id);
  const days = daysSinceApplied(application);
  const cvLink = links.find((link) => link.role === "cv" || link.documents?.kind === "cv");

  const passwordNote = application.portal_password_ref
    ? t("Contraseña guardada en {ref}", { ref: application.portal_password_ref })
    : null;

  return (
    <div className="space-y-10">
      <Block title={t("Candidatura")}>
        <Row label={t("Empresa")} value={application.companies?.name ?? UNKNOWN} />
        <Row label={t("Puesto")} value={application.role_title} />
        <Row label={t("Ubicación")} value={application.location ?? UNKNOWN} />
        <Row label={t("País")} value={application.country ?? UNKNOWN} />
        <Row
          label={t("Modalidad")}
          value={application.work_mode ? t(WORK_MODE_LABEL[application.work_mode]) : UNKNOWN}
        />
        <Row label={t("Tipo")} value={application.application_type ?? UNKNOWN} />
        <Row
          label={t("Fecha de solicitud")}
          value={application.applied_at ? fmtDate(application.applied_at) : UNKNOWN}
        />
        <Row
          label={t("Días desde la solicitud")}
          value={days === null ? UNKNOWN : t("{n} días", { n: days })}
        />
        <Row
          label={t("Prioridad")}
          value={application.priority ? t(PRIORITY_LABEL[application.priority] ?? application.priority) : UNKNOWN}
        />
      </Block>

      <Block title={t("Oportunidad")}>
        <Row
          label={t("Salario")}
          value={formatSalary(application.salary_min, application.salary_max, application.currency ?? "EUR")}
        />
        <Row label={t("Divisa")} value={application.currency ?? UNKNOWN} />
        <Row label={t("Periodo")} value={application.salary_period ?? UNKNOWN} />
        <Row label={t("Fecha de inicio")} value={application.start_date ? fmtDate(application.start_date) : UNKNOWN} />
        <Row label={t("Fecha de fin")} value={application.end_date ? fmtDate(application.end_date) : UNKNOWN} />
        <Row
          label={t("Duración")}
          value={application.duration_months ? t("{n} meses", { n: application.duration_months }) : UNKNOWN}
        />
        <Row
          label={t("Fecha límite de solicitud")}
          value={application.deadline_at ? fmtDate(application.deadline_at) : UNKNOWN}
        />
        <Row
          label={t("Patrocinio de visado")}
          value={application.visa_sponsorship == null ? UNKNOWN : application.visa_sponsorship ? t("Sí") : t("No")}
        />
        <Row
          label={t("Ayuda a la reubicación")}
          value={application.relocation_support == null ? UNKNOWN : application.relocation_support ? t("Sí") : t("No")}
        />
        <Row
          label={t("Convenio universitario")}
          value={application.university_agreement == null ? UNKNOWN : application.university_agreement ? t("Sí") : t("No")}
        />
        <Row label={t("Requisitos de idioma")} value={application.language_requirements ?? UNKNOWN} />
      </Block>

      <Block title={t("Proceso actual")}>
        <Row label={t("Siguiente paso")} value={application.next_action ?? UNKNOWN} />
        <Row
          label={t("Próxima fecha límite")}
          value={
            application.next_action_at
              ? `${fmtDate(application.next_action_at)} · ${relativeDay(application.next_action_at)}`
              : UNKNOWN
          }
        />
        <Row
          label={t("CV enviado")}
          value={
            cvLink?.documents
              ? `${cvLink.documents.name}${cvLink.documents.version ? ` · ${cvLink.documents.version}` : ""}`
              : UNKNOWN
          }
        />
      </Block>

      <Block title={t("Acceso")}>
        <Row label={t("Enlace original")} value={application.job_url ? t("Abrir oferta") : UNKNOWN} href={application.job_url} />
        <Row
          label={t("Portal del candidato")}
          value={application.candidate_portal_url ? t("Abrir portal") : UNKNOWN}
          href={application.candidate_portal_url}
        />
        <Row label={t("Proveedor del portal")} value={application.portal_provider ?? UNKNOWN} />
        <Row label={t("Identificador de la candidatura")} value={application.application_ref ?? UNKNOWN} />
        <Row label={t("Usuario / email de acceso")} value={application.portal_username ?? UNKNOWN} />
        <Row label={t("Contraseña")} value={passwordNote ?? UNKNOWN} />
      </Block>

      {(application.stage === "offer" || application.stage === "accepted") && (
        <OfferBlock application={application} />
      )}
    </div>
  );
}

function OfferBlock({ application }: { application: ApplicationWithCompany }) {
  const t = useT();
  const save = useSaveApplication();
  const [form, setForm] = useState({
    offer_salary: application.offer_salary?.toString() ?? "",
    offer_currency: application.offer_currency ?? application.currency ?? "EUR",
    offer_bonus: application.offer_bonus?.toString() ?? "",
    offer_equity: application.offer_equity ?? "",
    offer_benefits: application.offer_benefits ?? "",
    offer_start_date: toDateInputSafe(application.offer_start_date),
    offer_deadline_at: toDateInputSafe(application.offer_deadline_at),
    offer_decision: application.offer_decision ?? "pending",
    offer_rating: application.offer_rating ?? 0,
  });

  const set = (key: keyof typeof form) => (value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    await save.mutateAsync({
      id: application.id,
      values: {
        offer_salary: form.offer_salary ? Number(form.offer_salary) : null,
        offer_currency: form.offer_currency || null,
        offer_bonus: form.offer_bonus || null,
        offer_equity: form.offer_equity || null,
        offer_benefits: form.offer_benefits || null,
        offer_start_date: form.offer_start_date || null,
        offer_deadline_at: form.offer_deadline_at || null,
        offer_decision: form.offer_decision || null,
        offer_rating: form.offer_rating || null,
      },
    });
    toast.success(t("Oferta actualizada"));
  };

  return (
    <section className="rounded-2xl border border-violet/25 bg-violet/5 p-6">
      <h3 className="font-display text-base font-semibold tracking-tight text-violet">{t("Oferta")}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-xs text-muted-foreground">{t("Salario")}</label>
          <Input
            type="number"
            value={form.offer_salary}
            onChange={(e) => set("offer_salary")(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("Divisa")}</label>
          <Input value={form.offer_currency} onChange={(e) => set("offer_currency")(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("Bonus")}</label>
          <Input
            type="number"
            value={form.offer_bonus}
            onChange={(e) => set("offer_bonus")(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("Equity")}</label>
          <Input value={form.offer_equity} onChange={(e) => set("offer_equity")(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("Fecha de inicio")}</label>
          <Input
            type="date"
            value={form.offer_start_date}
            onChange={(e) => set("offer_start_date")(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("Fecha límite de respuesta")}</label>
          <Input
            type="date"
            value={form.offer_deadline_at}
            onChange={(e) => set("offer_deadline_at")(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-xs text-muted-foreground">{t("Beneficios")}</label>
          <Textarea
            rows={2}
            value={form.offer_benefits}
            onChange={(e) => set("offer_benefits")(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("Valoración")}</label>
          <div className="mt-1.5 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={t("Valorar con {n} estrellas", { n })}
                onClick={() => set("offer_rating")(n)}
              >
                <Star
                  className={cn(
                    "size-5",
                    n <= form.offer_rating ? "fill-gold text-gold" : "text-muted-foreground",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-xs text-muted-foreground">{t("Decisión")}</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {OFFER_DECISIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => set("offer_decision")(d.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  form.offer_decision === d.id
                    ? "border-violet bg-violet/12 text-violet"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {t(d.label)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Button className="mt-5 gap-1.5" onClick={submit}>
        <Save className="size-4" /> {t("Guardar oferta")}
      </Button>
    </section>
  );
}

function toDateInputSafe(value: string | null | undefined): string {
  if (!value) return "";
  return value.length <= 10 ? value : toDateInput(new Date(value));
}

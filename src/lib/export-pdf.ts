import type { ApplicationWithCompany, CalendarRow, TimelineRow } from "@/lib/domain";
import { STAGE_META, WORK_MODE_LABEL, formatSalary } from "@/lib/domain";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { daysSinceApplied } from "@/lib/alerts";

function escape(value: string): string {
  return value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char);
}

function row(label: string, value: string | null | undefined): string {
  return `<tr><th>${escape(label)}</th><td>${escape(value ?? "—")}</td></tr>`;
}

/**
 * Abre el diálogo de impresión del navegador con un resumen limpio de la
 * candidatura, listo para guardar como PDF (sin dependencias externas).
 */
export function exportApplicationSummary(
  app: ApplicationWithCompany,
  options: { timeline?: TimelineRow[]; events?: CalendarRow[]; notes?: string[] } = {},
): void {
  const timeline = options.timeline ?? [];
  const events = options.events ?? [];
  const days = daysSinceApplied(app);
  const company = app.companies?.name ?? "Sin empresa";

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8" />
<title>${escape(company)} — ${escape(app.role_title)}</title>
<style>
  @page { margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #16182b; margin: 0; }
  h1 { font-size: 24px; margin: 0 0 4px; letter-spacing: -0.02em; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #6b6f8a; margin: 28px 0 8px; }
  p.lead { margin: 0 0 4px; color: #4a4f6b; font-size: 14px; }
  .brand { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #6d4df6; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; width: 190px; font-weight: 500; color: #6b6f8a; padding: 6px 0; vertical-align: top; }
  td { padding: 6px 0; }
  ul { margin: 0; padding-left: 18px; font-size: 13px; }
  li { margin-bottom: 5px; }
  .foot { margin-top: 34px; font-size: 11px; color: #8a8fa6; }
</style></head><body>
<div class="brand">NextRound</div>
<h1>${escape(app.role_title)}</h1>
<p class="lead">${escape(company)}${app.location ? ` · ${escape(app.location)}` : ""}${
    app.work_mode ? ` · ${escape(WORK_MODE_LABEL[app.work_mode])}` : ""
  }</p>
<h2>Estado</h2>
<table>
  ${row("Etapa actual", STAGE_META[app.stage].label)}
  ${row("Enviada el", fmtDate(app.applied_at))}
  ${row("Días desde el envío", days === null ? "Sin enviar" : `${days} días`)}
  ${row("Tipo", app.employment_type ?? app.application_type)}
  ${row("Salario", formatSalary(app.salary_min, app.salary_max, app.currency ?? "EUR"))}
  ${row("Próxima acción", app.next_action)}
  ${row("Oferta", app.job_url)}
  ${row("Portal del candidato", app.candidate_portal_url)}
</table>
${
  timeline.length
    ? `<h2>Proceso</h2><ul>${timeline
        .map(
          (item) =>
            `<li><strong>${escape(item.title)}</strong> — ${escape(fmtDate(item.occurred_at))}${
              item.detail ? `<br />${escape(item.detail)}` : ""
            }</li>`,
        )
        .join("")}</ul>`
    : ""
}
${
  events.length
    ? `<h2>Citas</h2><ul>${events
        .map((item) => `<li>${escape(item.title)} — ${escape(fmtDateTime(item.starts_at))}</li>`)
        .join("")}</ul>`
    : ""
}
${
  options.notes?.length
    ? `<h2>Notas</h2><ul>${options.notes.map((note) => `<li>${escape(note)}</li>`).join("")}</ul>`
    : ""
}
<p class="foot">Generado con NextRound · ${escape(fmtDate(new Date().toISOString().slice(0, 10)))}</p>
</body></html>`;

  const win = window.open("", "_blank", "noopener,width=900,height=1000");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

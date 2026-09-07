import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, Mail, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { useT } from "@/lib/i18n/provider";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Ayuda — NextRound" },
      { name: "description", content: "Cómo funciona NextRound, preguntas frecuentes y feedback." },
      { property: "og:title", content: "Ayuda — NextRound" },
      { property: "og:description", content: "Guía rápida, preguntas frecuentes y feedback." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const t = useT();
  const [feedback, setFeedback] = useState("");

  const steps = [
    [t("Registra"), t("Añade cada candidatura con puesto, empresa, salario y origen.")],
    [t("Guarda el contexto"), t("Adjunta la oferta, el CV enviado y el enlace al portal del candidato.")],
    [t("Sigue"), t("Mueve la etapa a medida que avanza el proceso y agenda tus entrevistas.")],
    [t("Prepárate"), t("Usa NextRound AI para preparar entrevistas, pruebas y seguimientos.")],
    [t("Decide"), t("Revisa tus Insights para saber dónde poner el esfuerzo.")],
  ];

  const faqs = [
    [
      t("¿Quién puede ver mis datos?"),
      t("Solo tú. Tus candidaturas, documentos y notas son privados y están asociados a tu cuenta."),
    ],
    [
      t("¿Qué hace exactamente la IA?"),
      t(
        "NextRound AI usa la oferta guardada y el CV real que enviaste para ayudarte a preparar entrevistas, pruebas y mensajes de seguimiento.",
      ),
    ],
    [
      t("¿Cómo importo una oferta?"),
      t("Al crear o editar una candidatura, pega el texto de la oferta y quedará guardado junto al resto del proceso."),
    ],
    [
      t("¿Qué es una oportunidad guardada?"),
      t("Es una candidatura en etapa \"Guardada\": una oferta que te interesa pero todavía no has enviado."),
    ],
  ];

  const mailtoHref = `mailto:hola@nextround.app?subject=${encodeURIComponent(
    t("Feedback sobre NextRound"),
  )}&body=${encodeURIComponent(feedback)}`;

  return (
    <div className="space-y-7">
      <PageHeader title={t("Ayuda")} description={t("Cómo funciona NextRound y respuestas a las dudas más comunes.")} />

      <SectionCard title={t("Cómo funciona en 5 pasos")}>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map(([title, body], index) => (
            <li key={title}>
              <span className="font-display text-2xl font-semibold text-violet">{index + 1}</span>
              <h3 className="mt-1.5 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard title={t("Preguntas frecuentes")}>
        <div className="divide-y divide-border">
          {faqs.map(([question, answer]) => (
            <div key={question} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{question}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={t("¿Alguna sugerencia?")}
        subtitle={t("Cuéntanos qué mejorarías y te leemos por correo.")}
      >
        <Textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder={t("Escribe tu sugerencia aquí…")}
          rows={4}
        />
        <Button asChild className="mt-3 gap-1.5">
          <a href={mailtoHref}>
            <Mail className="size-4" /> {t("Enviar por email")}
          </a>
        </Button>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" /> {t("También puedes preguntarle directamente a NextRound AI.")}
        </p>
      </SectionCard>
    </div>
  );
}

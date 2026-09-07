import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApplications, useCalendar } from "@/lib/api";
import { attentionFeed } from "@/lib/next-action";
import { CLOSED_STAGES, STAGE_META } from "@/lib/domain";
import { relativeDay } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type Message = { id: string; role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Prepara mi próxima entrevista",
  "¿Qué debería hacer hoy?",
  "¿A qué candidaturas hago seguimiento?",
  "Analiza esta oferta",
  "Compara el rendimiento de mis CV",
  "Prepárame para una prueba técnica",
  "Resume mis candidaturas activas",
];

/**
 * Interfaz del asistente NextRound AI. La arquitectura ya está lista para
 * conectar un modelo: `answer()` es el único punto que habrá que sustituir por
 * la llamada al backend, y el contexto de datos ya se construye aquí.
 */
export function AiAssistant({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const { data: applications = [] } = useApplications();
  const { data: events = [] } = useCalendar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const active = applications.filter((app) => !app.archived && !CLOSED_STAGES.includes(app.stage));
  const feed = attentionFeed(applications, { events }, 3);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function answer(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes("hoy") || lower.includes("seguimiento")) {
      if (feed.length === 0) return t("Hoy no tienes nada urgente. Buen momento para añadir dos candidaturas nuevas.");
      return feed
        .map((item) => `· ${item.app.companies?.name ?? item.app.role_title}: ${item.action.label}`)
        .join("\n");
    }
    if (lower.includes("entrevista") || lower.includes("prueba")) {
      const next = events
        .filter((event) => new Date(event.starts_at).getTime() >= Date.now())
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
      return next
        ? t("Tu próxima cita es «{title}» ({when}). Repasa la oferta, prepara 3 logros con métricas y 2 preguntas para el equipo.", {
            title: next.title,
            when: relativeDay(next.starts_at),
          })
        : t("No tienes citas agendadas. Cuando agendes una entrevista prepararé un guion contigo.");
    }
    if (lower.includes("cv")) {
      return t("Vincula el CV que envías en cada candidatura y podré comparar qué versión consigue más respuestas.");
    }
    if (lower.includes("resume") || lower.includes("activas")) {
      return active
        .slice(0, 6)
        .map((app) => `· ${app.companies?.name ?? "—"} — ${app.role_title} (${t(STAGE_META[app.stage].label)})`)
        .join("\n");
    }
    return t(
      "Estoy conectado a tus {n} candidaturas activas. La respuesta con modelo completo llega muy pronto; de momento puedo resumirte tu día, tus seguimientos y tus próximas entrevistas.",
      { n: active.length },
    );
  }

  function send(prompt: string) {
    const text = prompt.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text },
      { id: `a-${Date.now()}`, role: "ai", text: answer(text) },
    ]);
    setInput("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end sm:p-4">
      <button className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" aria-label="Cerrar asistente" onClick={() => onOpenChange(false)} />
      <aside className="relative flex h-full w-full flex-col bg-surface shadow-lift sm:w-[420px] sm:rounded-3xl">
        <header className="flex items-center gap-3 px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-xl bg-violet/12 text-violet">
            <Sparkles className="size-4" />
          </span>
          <div className="flex-1">
            <p className="font-display text-sm font-semibold">{t("NextRound AI")}</p>
            <p className="text-[11px] text-muted-foreground">
              {t("Conectado a {n} candidaturas activas", { n: active.length })}
            </p>
          </div>
          <button onClick={() => onOpenChange(false)} aria-label={t("Cerrar")} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </header>

        <div className="scrollbar-slim flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          {messages.length === 0 ? (
            <div className="space-y-4 pt-2">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {t("¿Con qué te ayudo?")}
              </h2>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {t(suggestion)}
                  </button>
                ))}
              </div>
              {feed.length > 0 && (
                <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
                  {t("Ahora mismo veo {n} cosas que necesitan atención, empezando por {name}.", {
                    n: feed.length,
                    name: feed[0]?.app.companies?.name ?? feed[0]?.app.role_title ?? "",
                  })}
                </p>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-surface-2",
                )}
              >
                {message.text}
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        <form
          className="flex items-center gap-2 px-5 pb-5 pt-1"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("Escribe lo que necesitas…")}
            className="h-11 flex-1 rounded-xl bg-surface-2 px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <Button type="submit" size="icon" className="size-11 rounded-xl" aria-label={t("Enviar")}>
            <ArrowUp className="size-4" />
          </Button>
        </form>
      </aside>
    </div>
  );
}

export function AiAssistantButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-violet px-4 py-3 text-sm font-medium text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5 lg:bottom-7 lg:right-7"
    >
      <Sparkles className="size-4" />
      {t("NextRound AI")}
    </button>
  );
}

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useApplications } from "@/lib/api";
import { CLOSED_STAGES } from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const GENERAL_SUGGESTIONS = [
  "¿Qué debería hacer hoy?",
  "¿A qué candidaturas hago seguimiento?",
  "Resume mis candidaturas activas",
  "¿Qué me falta preparar para mi próxima entrevista?",
];

const APPLICATION_SUGGESTIONS = [
  "¿Qué debería hacer ahora con esta candidatura?",
  "¿Crees que debería hacer follow-up?",
  "Resume todo lo que ha pasado con esta candidatura.",
  "¿Qué me falta preparar para la entrevista?",
  "¿Qué cambió desde el último email?",
  "¿Qué CV envié a esta empresa?",
];

/* ---------------------------------------------------------------- contexto */

type AssistantCtx = {
  /** Abre el asistente, opcionalmente enfocado en una candidatura concreta. */
  openAssistant: (applicationId?: string | null) => void;
};

const AssistantContext = createContext<AssistantCtx>({ openAssistant: () => {} });

/** Permite a cualquier pantalla abrir el asistente con foco en una candidatura. */
export function useAssistant() {
  return useContext(AssistantContext);
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const value = useMemo<AssistantCtx>(
    () => ({
      openAssistant: (id?: string | null) => {
        setApplicationId(id ?? null);
        setOpen(true);
      },
    }),
    [],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ applicationId?: string | null }>).detail;
      setApplicationId(detail?.applicationId ?? null);
      setOpen(true);
    };
    window.addEventListener("nextround:ai", handler);
    return () => window.removeEventListener("nextround:ai", handler);
  }, []);



  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AiAssistant open={open} onOpenChange={setOpen} applicationId={applicationId} />
    </AssistantContext.Provider>
  );
}

/* -------------------------------------------------------------- asistente */

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/**
 * Chat real de NextRound AI: envía los mensajes a `/api/chat`, que construye el
 * contexto del usuario autenticado (RLS) y llama al modelo con streaming.
 * La IA nunca modifica datos: solo puede proponer cambios que el usuario aplica.
 */
export function AiAssistant({
  open,
  onOpenChange,
  applicationId = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId?: string | null;
}) {
  const t = useT();
  const { data: applications = [] } = useApplications();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const appIdRef = useRef<string | null>(applicationId);
  appIdRef.current = applicationId;

  const active = applications.filter((app) => !app.archived && !CLOSED_STAGES.includes(app.stage));
  const focused = applicationId ? applications.find((app) => app.id === applicationId) : undefined;

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages, api }) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return {
            api,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: { messages, applicationId: appIdRef.current },
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error, setMessages, clearError } = useChat<UIMessage>({
    transport,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, status]);

  // Al cambiar de candidatura enfocada empezamos una conversación limpia.
  useEffect(() => {
    setMessages([]);
    clearError();
  }, [applicationId, setMessages, clearError]);

  const busy = status === "submitted" || status === "streaming";

  function send(prompt: string) {
    const text = prompt.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  }

  if (!open) return null;

  const suggestions = focused ? APPLICATION_SUGGESTIONS : GENERAL_SUGGESTIONS;

  return (
    <div className="fixed inset-0 z-50 flex justify-end sm:p-4">
      <button
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        aria-label={t("Cerrar")}
        onClick={() => onOpenChange(false)}
      />
      <aside className="relative flex h-full w-full flex-col bg-surface shadow-lift sm:w-[440px] sm:rounded-3xl">
        <header className="flex items-center gap-3 px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-xl bg-violet/12 text-violet">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold">{t("NextRound AI")}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {focused
                ? `${focused.companies?.name ?? ""} · ${focused.role_title}`
                : t("Conectado a {n} candidaturas activas", { n: active.length })}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label={t("Cerrar")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="scrollbar-slim flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          {messages.length === 0 ? (
            <div className="space-y-4 pt-2">
              <h2 className="font-display text-xl font-semibold tracking-tight">{t("¿Con qué te ayudo?")}</h2>
              <div className="flex flex-col gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {t(suggestion)}
                  </button>
                ))}
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
                {t(
                  "Responde con tus datos reales. Puede sugerir cambios, pero nunca modifica tus candidaturas: los aplicas tú.",
                )}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const text = messageText(message);
              if (!text) return null;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-surface-2",
                  )}
                >
                  {text}
                </div>
              );
            })
          )}

          {busy && (
            <p className="animate-pulse text-xs text-muted-foreground">{t("Pensando con tus datos…")}</p>
          )}

          {error && (
            <div className="rounded-xl bg-danger/8 px-3.5 py-2.5 text-xs leading-relaxed text-danger">
              {error.message || t("El asistente no ha podido responder ahora mismo. Inténtalo de nuevo.")}
            </div>
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
          <Button
            type="submit"
            size="icon"
            disabled={busy}
            className="size-11 rounded-xl"
            aria-label={t("Enviar")}
          >
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

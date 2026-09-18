import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
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
      <aside className="relative flex h-full w-full flex-col overflow-hidden bg-surface shadow-lift sm:w-[440px] sm:rounded-xl">
        <header className="relative flex items-center gap-3 border-b border-primary/10 bg-accent/45 px-5 py-4 after:absolute after:bottom-0 after:left-5 after:h-[2px] after:w-12 after:bg-lime">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
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
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="scrollbar-slim flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          {messages.length === 0 ? (
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Career copilot</p>
                <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight">{t("¿Con qué te ayudo?")}</h2>
              </div>
              <div className="flex flex-col gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="rounded-xl border border-border/60 bg-background px-3.5 py-3 text-left text-sm transition-all duration-200 hover:border-primary/20 hover:bg-accent/55 hover:text-primary"
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
              const isUser = message.role === "user";
              return (
                <Message key={message.id} from={message.role} className={cn(isUser && "max-w-[88%]")}>
                  <MessageContent
                    className={cn(
                      isUser
                        ? "whitespace-pre-wrap rounded-xl bg-primary px-3.5 py-2.5 leading-relaxed text-primary-foreground"
                        : "w-full gap-0 overflow-visible py-1 leading-relaxed",
                    )}
                  >
                    {isUser ? (
                      text
                    ) : (
                      <MessageResponse className="[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/25 [&_blockquote]:pl-3 [&_h1]:font-display [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_hr]:my-5 [&_hr]:border-border [&_li]:my-1 [&_ol]:my-3 [&_p]:my-2.5 [&_strong]:font-semibold [&_ul]:my-3">
                        {text}
                      </MessageResponse>
                    )}
                  </MessageContent>
                </Message>
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
          className="flex items-center gap-2 border-t border-border/60 bg-surface px-5 pb-5 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("Escribe lo que necesitas…")}
            className="h-11 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm shadow-soft outline-none placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/15"
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
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5 lg:bottom-7 lg:right-7"
    >
      <Sparkles className="size-4" />
      {t("NextRound AI")}
    </button>
  );
}

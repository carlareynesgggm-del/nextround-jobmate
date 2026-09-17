import { Mail, Plug, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { useGmailActions, useGmailCallbackToast } from "@/lib/inbox/use-gmail";

/** Tarjeta de Gmail en Inicio: conectar o revisar correos sin entrar en Ajustes. */
export function GmailHomeCard() {
  const t = useT();
  const { gmail, busy, startConnect, runSync } = useGmailActions();
  useGmailCallbackToast();

  const connected = gmail?.status === "connected";

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border">
            <Mail className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight">
              {connected ? t("Tu correo está conectado") : t("Conecta tu correo")}
            </h2>
            {connected ? (
              <>
                <p className="text-sm text-muted-foreground">{gmail?.email_address}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {gmail?.last_sync_at
                    ? t("Última revisión: {date}", { date: fmtDateTime(gmail.last_sync_at) })
                    : t("Sin revisiones todavía")}
                </p>
              </>
            ) : (
              <p className="max-w-xl text-sm text-muted-foreground">
                {t(
                  "NextRound puede detectar entrevistas, pruebas y respuestas relacionadas con tus candidaturas.",
                )}
              </p>
            )}
          </div>
        </div>

        {connected ? (
          <Button className="gap-1.5" disabled={busy === "sync"} onClick={() => void runSync()}>
            <RefreshCw className={busy === "sync" ? "size-4 animate-spin" : "size-4"} />
            {t("Revisar correos ahora")}
          </Button>
        ) : (
          <Button
            className="gap-1.5"
            disabled={busy === "connect"}
            onClick={() => void startConnect("/dashboard")}
          >
            <Plug className="size-4" /> {t("Conectar Gmail")}
          </Button>
        )}
      </div>
      {!connected && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {t("Solo lectura de correos, sin contraseñas y puedes desconectarlo cuando quieras.")}
        </p>
      )}
    </section>
  );
}

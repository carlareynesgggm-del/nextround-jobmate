import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { useGmailActions, useGmailCallbackToast } from "@/lib/inbox/use-gmail";

/** Tarjeta de Gmail en Inicio: conectar o revisar correos sin entrar en Ajustes. */
export function GmailHomeCard() {
  const t = useT();
  const { gmail, busy, startConnect, runSync } = useGmailActions({ autoInitialScan: true });
  useGmailCallbackToast();

  const connected = gmail?.status === "connected";

  return (
    <section className="relative overflow-hidden rounded-xl border border-border/70 bg-surface p-5 shadow-soft before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary ring-1 ring-inset ring-primary/10">
            <Mail className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-[15px] font-semibold">
              {connected ? t("Tu correo está conectado") : t("Conecta tu correo")}
            </h3>
            {connected ? (
              <>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{gmail?.email_address}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {busy === "sync"
                    ? t("Escaneando tus últimos 60 días de correo…")
                    : gmail?.last_sync_at
                      ? t("Última revisión: {date}", { date: fmtDateTime(gmail.last_sync_at) })
                      : t("Sin revisiones todavía")}
                </p>
              </>
            ) : (
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                {t(
                  "NextRound puede detectar automáticamente candidaturas, entrevistas, pruebas, rechazos y ofertas de los últimos 60 días.",
                )}
              </p>
            )}
          </div>
        </div>

        {connected ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" className="gap-1.5" disabled={busy === "sync"} onClick={() => void runSync()}>
              <RefreshCw className={busy === "sync" ? "size-3.5 animate-spin" : "size-3.5"} />
              {t("Revisar correos ahora")}
            </Button>
            <Link
              to="/inbox"
              className="inline-flex items-center gap-1 px-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("Ver novedades")} <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <Button
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={busy === "connect"}
            onClick={() => void startConnect("/dashboard")}
          >
            <Mail className="size-3.5" /> {t("Conectar Gmail")}
          </Button>
        )}
      </div>
      {!connected && (
        <p className="mt-3.5 text-[11px] text-muted-foreground">
          {t("Solo lectura de correos, sin contraseñas y puedes desconectarlo cuando quieras.")}
        </p>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Plug, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/ui-bits";
import { useT } from "@/lib/i18n/provider";
import {
  inboxKeys,
  useDisconnectEmail,
  useEmailConnections,
  useUpdateEmailConnection,
} from "@/lib/inbox/api";
import { startGmailConnect, syncGmail } from "@/lib/inbox/gmail.functions";
import { EMAIL_PROVIDER_LABEL, type EmailProvider } from "@/lib/inbox/domain";
import { fmtDateTime } from "@/lib/format";

/** Conexión de correo: detecta novedades del proceso y pregunta antes de cambiar nada. */
export function EmailConnectionCard() {
  const t = useT();
  const qc = useQueryClient();
  const { data: connections = [] } = useEmailConnections();
  const update = useUpdateEmailConnection();
  const disconnect = useDisconnectEmail();
  const connect = useServerFn(startGmailConnect);
  const sync = useServerFn(syncGmail);
  const [busy, setBusy] = useState<"connect" | "sync" | null>(null);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("gmail");
    if (!status) return;
    if (status === "connected") toast.success(t("Gmail conectado. Ya puedes revisar tus correos."));
    else if (status === "cancelled") toast.info(t("Has cancelado la conexión con Gmail."));
    else if (status === "no_refresh_token")
      toast.error(t("Google no devolvió permiso permanente. Vuelve a intentarlo aceptando el acceso."));
    else toast.error(t("No se pudo completar la conexión con Gmail."));
    void qc.invalidateQueries({ queryKey: inboxKeys.connections });
    window.history.replaceState({}, "", window.location.pathname);
  }, [qc, t]);

  async function startConnect() {
    setBusy("connect");
    try {
      const { url } = await connect({ data: { origin: window.location.origin, redirect: "/settings" } });
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo iniciar la conexión."));
      setBusy(null);
    }
  }

  async function runSync() {
    setBusy("sync");
    try {
      const result = await sync({ data: undefined });
      void qc.invalidateQueries({ queryKey: inboxKeys.connections });
      void qc.invalidateQueries({ queryKey: inboxKeys.events });
      toast.success(
        result.detected > 0
          ? t("{n} correos del proceso detectados. Revísalos en Inicio.", { n: result.detected })
          : t("Sin novedades nuevas en tu correo."),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo revisar Gmail."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SectionCard title={t("Correo conectado")}>
      <p className="text-sm text-muted-foreground">
        {t(
          "NextRound puede leer solo los correos relacionados con tus candidaturas para detectar entrevistas, pruebas y respuestas. Nunca cambia nada sin tu confirmación.",
        )}
      </p>

      {connections.length === 0 ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" /> {t("Todavía no has conectado ningún correo.")}
          </div>
          <Button variant="outline" className="w-full gap-1.5" disabled={busy === "connect"} onClick={startConnect}>
            <Plug className="size-4" /> {t("Conectar Gmail")}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            {t("Solo lectura de correos, sin contraseñas y puedes desconectarlo cuando quieras.")}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {connections.map((connection) => (
            <li key={connection.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {t(EMAIL_PROVIDER_LABEL[connection.provider as EmailProvider] ?? connection.provider)}
                </p>
                <span
                  className={
                    connection.status === "connected"
                      ? "rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium"
                      : "rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive"
                  }
                >
                  {connection.status === "connected" ? t("Conectado") : t("Con problemas")}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{connection.email_address}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {connection.last_sync_at
                  ? t("Última revisión: {date}", { date: fmtDateTime(connection.last_sync_at) })
                  : t("Sin revisiones todavía")}
              </p>

              <label className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span>{t("Preguntar antes de actualizar mis datos")}</span>
                <Switch
                  checked={connection.ask_before_update}
                  onCheckedChange={(checked) =>
                    void update.mutateAsync({
                      id: connection.id,
                      patch: { ask_before_update: checked },
                    })
                  }
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {connection.provider === "gmail" && (
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={busy === "sync"} onClick={runSync}>
                    <RefreshCw className={busy === "sync" ? "size-3.5 animate-spin" : "size-3.5"} />{" "}
                    {t("Revisar correos ahora")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => void disconnect.mutateAsync(connection.id)}
                >
                  <Unplug className="size-3.5" /> {t("Desconectar")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

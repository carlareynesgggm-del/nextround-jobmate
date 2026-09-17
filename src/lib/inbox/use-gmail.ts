import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { inboxKeys, useEmailConnections } from "@/lib/inbox/api";
import { startGmailConnect, syncGmail } from "@/lib/inbox/gmail.functions";
import { useT } from "@/lib/i18n/provider";

/**
 * Acciones compartidas de Gmail (conectar y revisar correos).
 * Reutiliza las funciones de servidor existentes: no duplica el flujo OAuth.
 */
export function useGmailActions() {
  const t = useT();
  const qc = useQueryClient();
  const { data: connections = [] } = useEmailConnections();
  const connect = useServerFn(startGmailConnect);
  const sync = useServerFn(syncGmail);
  const [busy, setBusy] = useState<"connect" | "sync" | null>(null);

  const gmail = connections.find((item) => item.provider === "gmail") ?? null;

  async function startConnect(redirect: string) {
    setBusy("connect");
    try {
      const { url } = await connect({ data: { origin: window.location.origin, redirect } });
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
          ? t("{n} correos del proceso detectados. Revísalos más abajo.", { n: result.detected })
          : t("Sin novedades nuevas en tu correo."),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo revisar Gmail."));
    } finally {
      setBusy(null);
    }
  }

  return { connections, gmail, busy, startConnect, runSync };
}

/** Muestra el resultado del retorno de Google (?gmail=...) una sola vez. */
export function useGmailCallbackToast() {
  const t = useT();
  const qc = useQueryClient();

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
}

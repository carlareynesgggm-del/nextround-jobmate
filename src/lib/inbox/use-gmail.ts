import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { inboxKeys, useEmailConnections } from "@/lib/inbox/api";
import { startGmailConnect, syncGmail } from "@/lib/inbox/gmail.functions";
import { useT } from "@/lib/i18n/provider";

/** Conexiones cuyo escaneo inicial ya se ha lanzado en esta sesión. */
const initialScanStarted = new Set<string>();

export type ScanResult = { scanned: number; detected: number; processes: number };

/**
 * Acciones compartidas de Gmail (conectar y escanear correos).
 * Reutiliza las funciones de servidor existentes: no duplica el flujo OAuth.
 */
export function useGmailActions(options?: { autoInitialScan?: boolean }) {
  const t = useT();
  const qc = useQueryClient();
  const { data: connections = [] } = useEmailConnections();
  const connect = useServerFn(startGmailConnect);
  const sync = useServerFn(syncGmail);
  const [busy, setBusy] = useState<"connect" | "sync" | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const running = useRef(false);

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

  /** Escanea los últimos 60 días sin bloquear la interfaz. */
  const runSync = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (running.current) return;
      running.current = true;
      setBusy("sync");
      try {
        const result = (await sync({ data: {} })) as ScanResult;
        setLastResult(result);
        void qc.invalidateQueries({ queryKey: inboxKeys.connections });
        void qc.invalidateQueries({ queryKey: inboxKeys.events });
        void qc.invalidateQueries({ queryKey: ["email", "suggestions"] });
        if (!opts?.silent) {
          toast.success(
            result.detected > 0
              ? t("{n} procesos detectados en tu correo. Revísalos y confirma lo que quieras.", {
                  n: result.processes || result.detected,
                })
              : t("Sin novedades nuevas en tu correo."),
          );
        }
      } catch (error) {
        if (!opts?.silent) {
          toast.error(error instanceof Error ? error.message : t("No se pudo revisar Gmail."));
        }
      } finally {
        running.current = false;
        setBusy(null);
      }
    },
    [qc, sync, t],
  );

  // Escaneo inicial automático la primera vez que la cuenta queda conectada.
  useEffect(() => {
    if (!options?.autoInitialScan) return;
    if (!gmail || gmail.status !== "connected" || gmail.last_sync_at) return;
    if (initialScanStarted.has(gmail.id)) return;
    initialScanStarted.add(gmail.id);
    void runSync({ silent: true });
  }, [gmail, options?.autoInitialScan, runSync]);

  return { connections, gmail, busy, lastResult, startConnect, runSync };
}

/** Muestra el resultado del retorno de Google (?gmail=...) una sola vez. */
export function useGmailCallbackToast() {
  const t = useT();
  const qc = useQueryClient();

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("gmail");
    if (!status) return;
    if (status === "connected")
      toast.success(t("Gmail conectado. Estamos revisando tus últimos 60 días de correo."));
    else if (status === "cancelled") toast.info(t("Has cancelado la conexión con Gmail."));
    else if (status === "no_refresh_token")
      toast.error(t("Google no devolvió permiso permanente. Vuelve a intentarlo aceptando el acceso."));
    else toast.error(t("No se pudo completar la conexión con Gmail."));
    void qc.invalidateQueries({ queryKey: inboxKeys.connections });
    window.history.replaceState({}, "", window.location.pathname);
  }, [qc, t]);
}

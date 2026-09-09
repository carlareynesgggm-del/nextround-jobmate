import { Mail, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/ui-bits";
import { useT } from "@/lib/i18n/provider";
import {
  useDisconnectEmail,
  useEmailConnections,
  useUpdateEmailConnection,
} from "@/lib/inbox/api";
import { EMAIL_PROVIDER_LABEL, type EmailProvider } from "@/lib/inbox/domain";
import { fmtDateTime } from "@/lib/format";

/** Conexión de correo: detecta novedades del proceso y pregunta antes de cambiar nada. */
export function EmailConnectionCard() {
  const t = useT();
  const { data: connections = [] } = useEmailConnections();
  const update = useUpdateEmailConnection();
  const disconnect = useDisconnectEmail();

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
          <Button
            variant="outline"
            className="w-full gap-1.5"
            onClick={() =>
              toast.info(
                t(
                  "La conexión con Gmail y Outlook está pendiente de activarse para tu cuenta. Te avisaremos en cuanto esté lista.",
                ),
              )
            }
          >
            <Plug className="size-4" /> {t("Conectar Gmail o Outlook")}
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {connections.map((connection) => (
            <li key={connection.id} className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium">
                {t(EMAIL_PROVIDER_LABEL[connection.provider as EmailProvider] ?? connection.provider)}
              </p>
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

              <Button
                variant="ghost"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => void disconnect.mutateAsync(connection.id)}
              >
                <Unplug className="size-3.5" /> {t("Desconectar")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

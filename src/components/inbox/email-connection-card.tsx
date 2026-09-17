import { Mail, Unplug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/ui-bits";
import { useT } from "@/lib/i18n/provider";
import { useDisconnectEmail, useUpdateEmailConnection } from "@/lib/inbox/api";
import { useGmailActions, useGmailCallbackToast } from "@/lib/inbox/use-gmail";
import { EMAIL_PROVIDER_LABEL, type EmailProvider } from "@/lib/inbox/domain";

/** Ajustes de correo: cuenta conectada, desconectar y confirmación antes de actualizar. */
export function EmailConnectionCard() {
  const t = useT();
  const { connections } = useGmailActions();
  const update = useUpdateEmailConnection();
  const disconnect = useDisconnectEmail();
  useGmailCallbackToast();

  return (
    <SectionCard title={t("Correo conectado")}>
      {connections.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="size-4" />
          {t("Todavía no has conectado ningún correo. Puedes conectarlo desde Inicio.")}
        </div>
      ) : (
        <ul className="space-y-4">
          {connections.map((connection) => (
            <li key={connection.id} className="rounded-xl border border-border/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {t(EMAIL_PROVIDER_LABEL[connection.provider as EmailProvider] ?? connection.provider)}
                </p>
                <span
                  className={
                    connection.status === "connected"
                      ? "rounded-full border border-border/70 bg-surface px-2 py-0.5 text-[10px] font-medium"
                      : "rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive"
                  }
                >
                  {connection.status === "connected" ? t("Conectado") : t("Con problemas")}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{connection.email_address}</p>

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

              <div className="mt-3">
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

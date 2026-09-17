import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui-bits";
import { LanguageSwitcher } from "@/components/language-switcher";
import { EmailConnectionCard } from "@/components/inbox/email-connection-card";
import { useT } from "@/lib/i18n/provider";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { qk, useProfile } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes — NextRound" },
      {
        name: "description",
        content:
          "Actualiza tu perfil, el puesto objetivo y el objetivo semanal de candidaturas en NextRound.",
      },
      { property: "og:title", content: "Ajustes — NextRound" },
      {
        property: "og:description",
        content: "Perfil, puesto objetivo y objetivo semanal de candidaturas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

/** Fila de ajustes: título y descripción a la izquierda, controles a la derecha. */
function SettingsRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 border-t border-border/60 py-8 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-12">
      <div className="min-w-0">
        <h2 className="font-display text-[16px] font-semibold">{title}</h2>
        {description && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function SettingsPage() {
  const t = useT();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("5");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const row = profile as {
      full_name: string | null;
      headline: string | null;
      location: string | null;
      target_role: string | null;
      weekly_goal: number | null;
    };
    setFullName(row.full_name ?? "");
    setHeadline(row.headline ?? "");
    setLocation(row.location ?? "");
    setTargetRole(row.target_role ?? "");
    setWeeklyGoal(String(row.weekly_goal ?? 5));
  }, [profile]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        headline: headline.trim() || null,
        location: location.trim() || null,
        target_role: targetRole.trim() || null,
        weekly_goal: Number(weeklyGoal) || 5,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: qk.profile });
    toast.success(t("Perfil actualizado"));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("Ajustes")} description={t("Tu perfil y tus objetivos de búsqueda.")} />

      <div className="mt-9">
        <SettingsRow title={t("Perfil")} description={t("Cómo te llamamos dentro de NextRound.")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-name">{t("Nombre")}</Label>
              <Input
                id="s-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="s-headline">{t("Titular profesional")}</Label>
              <Input
                id="s-headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder={t("Product Designer · Sistemas de diseño")}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="s-location">{t("Ubicación")}</Label>
              <Input
                id="s-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="s-target">{t("Puesto objetivo")}</Label>
              <Input
                id="s-target"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="s-goal">{t("Objetivo semanal de candidaturas")}</Label>
              <Input
                id="s-goal"
                inputMode="numeric"
                value={weeklyGoal}
                onChange={(event) => setWeeklyGoal(event.target.value.replace(/\D/g, ""))}
                className="mt-1.5"
              />
            </div>
          </div>
          <Button className="mt-5 gap-1.5" onClick={save} disabled={saving}>
            <Save className="size-4" /> {saving ? t("Guardando…") : t("Guardar cambios")}
          </Button>
        </SettingsRow>

        <SettingsRow
          title={t("Correo conectado")}
          description={t("Solo lectura, y nada se guarda sin tu confirmación.")}
        >
          <EmailConnectionCard />
        </SettingsRow>

        <SettingsRow title={t("Idioma")} description={t("Se aplica a toda la interfaz de inmediato.")}>
          <LanguageSwitcher variant="sidebar" className="border border-border" />
        </SettingsRow>

        <SettingsRow
          title={t("Cuenta")}
          description={t("Tus candidaturas, notas y documentos son privados: nadie más puede verlos.")}
        >
          <p className="text-[13px] text-muted-foreground">{t("Sesión iniciada como")}</p>
          <p className="mt-0.5 truncate text-[13px] font-medium">{user?.email}</p>
          <Button
            variant="outline"
            className="mt-4 gap-1.5"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" /> {t("Cerrar sesión")}
          </Button>
        </SettingsRow>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, SectionCard } from "@/components/ui-bits";
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

function SettingsPage() {
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
    toast.success("Perfil actualizado");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ajustes" description="Tu perfil y tus objetivos de búsqueda." />

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Perfil" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-name">Nombre</Label>
              <Input
                id="s-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="s-headline">Titular profesional</Label>
              <Input
                id="s-headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="Product Designer · Sistemas de diseño"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="s-location">Ubicación</Label>
              <Input
                id="s-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="s-target">Puesto objetivo</Label>
              <Input
                id="s-target"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="s-goal">Objetivo semanal de candidaturas</Label>
              <Input
                id="s-goal"
                inputMode="numeric"
                value={weeklyGoal}
                onChange={(event) => setWeeklyGoal(event.target.value.replace(/\D/g, ""))}
                className="mt-1.5"
              />
            </div>
          </div>
          <Button className="mt-4 gap-1.5" onClick={save} disabled={saving}>
            <Save className="size-4" /> {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </SectionCard>

        <SectionCard title="Cuenta">
          <p className="text-sm text-muted-foreground">Sesión iniciada como</p>
          <p className="mt-1 truncate text-sm font-medium">{user?.email}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Tus candidaturas, notas y documentos son privados: nadie más puede verlos.
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full gap-1.5"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}

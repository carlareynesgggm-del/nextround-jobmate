import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  FileText,
  HelpCircle,
  Home,
  Inbox,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApplicationDialog } from "@/components/application-dialog";
import { AiAssistantButton, AssistantProvider, useAssistant } from "@/components/ai-assistant";
import { AlertsBell } from "@/components/alerts-bell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/lib/i18n/provider";

const NAV = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/applications", label: "Candidaturas", icon: Briefcase },
  { to: "/inbox", label: "Novedades", icon: Inbox },
  { to: "/calendar", label: "Calendario", icon: CalendarDays },
  { to: "/vault", label: "CVs", icon: FileText },
  { to: "/analytics", label: "Insights", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const t = useT();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const email = user?.email ?? "";
  const displayName = email.split("@")[0] ?? t("Cuenta");

  function navLink(item: { to: string; label: string; icon: typeof Home }) {
    const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
          active
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-soft"
            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <Icon
          className={cn(
            "size-[17px] transition-colors",
            active ? "text-sidebar-primary" : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/70",
          )}
        />
        {t(item.label)}
      </Link>
    );
  }

  const sidebarInner = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary font-display text-[13px] font-bold text-primary-foreground">
          N
        </span>
        <p className="font-display text-[15px] font-semibold tracking-tight">NextRound</p>
      </div>

      <div className="px-3 pb-6">
        <Button
          onClick={() => {
            setNewOpen(true);
            setMobileOpen(false);
          }}
          className="w-full justify-start gap-2"
        >
          <Plus className="size-4" />
          {t("Nueva candidatura")}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">{NAV.map(navLink)}</nav>

      <div className="space-y-0.5 px-3 pb-4">
        <div className="mb-2 h-px bg-sidebar-border" />
        {navLink({ to: "/help", label: "Ayuda", icon: HelpCircle })}
        {navLink({ to: "/settings", label: "Ajustes", icon: Settings })}
        <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-foreground/70 ring-1 ring-inset ring-sidebar-border">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{displayName}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/50">{email}</p>
          </div>
          <button
            onClick={signOut}
            aria-label={t("Cerrar sesión")}
            className="rounded-md p-1.5 text-sidebar-foreground/45 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AssistantProvider>
      <div className="min-h-screen bg-background">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-sidebar-border lg:block">
          {sidebarInner}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
              aria-label={t("Cerrar menú")}
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[272px] border-r border-sidebar-border">
              {sidebarInner}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-md p-1.5 text-sidebar-foreground/60"
                aria-label={t("Cerrar")}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        <div className="lg:pl-[248px]">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/60 bg-background/85 px-5 backdrop-blur-md md:px-10">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label={t("Abrir menú")}
              className="rounded-lg border border-border p-2 lg:hidden"
            >
              <Menu className="size-4" />
            </button>
            <span className="font-display text-sm font-semibold lg:hidden">NextRound</span>
            <div className="ml-auto flex items-center gap-1">
              <AlertsBell />
              <LanguageSwitcher />
              <AskAiHeaderButton />
              <Button size="sm" className="gap-1.5 lg:hidden" onClick={() => setNewOpen(true)}>
                <Plus className="size-3.5" />
                {t("Nueva")}
              </Button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-8 md:px-10 md:pt-10">{children}</main>
        </div>

        <FloatingAssistantButton />
        <ApplicationDialog open={newOpen} onOpenChange={setNewOpen} />
      </div>
    </AssistantProvider>
  );
}

function AskAiHeaderButton() {
  const t = useT();
  const { openAssistant } = useAssistant();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="hidden gap-1.5 sm:inline-flex"
      onClick={() => openAssistant(null)}
    >
      <Sparkles className="size-3.5" />
      {t("Pregunta a NextRound AI")}
    </Button>
  );
}

function FloatingAssistantButton() {
  const { openAssistant } = useAssistant();
  return <AiAssistantButton onClick={() => openAssistant(null)} />;
}

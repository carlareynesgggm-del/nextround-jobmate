import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  FileText,
  Home,
  LogOut,
  Menu,
  Plus,
  Settings,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApplicationDialog } from "@/components/application-dialog";
import { AiAssistant, AiAssistantButton } from "@/components/ai-assistant";
import { AlertsBell } from "@/components/alerts-bell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/applications", label: "Candidaturas", icon: Briefcase },
  { to: "/calendar", label: "Calendario", icon: CalendarDays },
  { to: "/vault", label: "CVs", icon: FileText },
  { to: "/analytics", label: "Insights", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const email = user?.email ?? "";
  const displayName = email.split("@")[0] ?? "Cuenta";

  function navLink(item: { to: string; label: string; icon: typeof Home }) {
    const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
          active
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <Icon className={cn("size-4", active ? "text-sidebar-primary" : "opacity-70")} />
        {item.label}
      </Link>
    );
  }

  const sidebarInner = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <span className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">
          N
        </span>
        <p className="font-display text-sm font-semibold tracking-tight">NextRound</p>
      </div>

      <div className="px-3 pb-5">
        <Button
          onClick={() => {
            setNewOpen(true);
            setMobileOpen(false);
          }}
          className="w-full justify-start gap-2 rounded-xl"
        >
          <Plus className="size-4" />
          Nueva candidatura
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">{NAV.map(navLink)}</nav>

      <div className="space-y-1 p-3">
        {navLink({ to: "/settings", label: "Ajustes", icon: Settings })}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{displayName}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/55">{email}</p>
          </div>
          <button
            onClick={signOut}
            aria-label="Cerrar sesión"
            className="rounded-lg p-1.5 text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border lg:block">
        {sidebarInner}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-foreground/30"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72">
            {sidebarInner}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-1.5 text-sidebar-foreground/70"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-2 bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="rounded-xl border border-border p-2 lg:hidden"
          >
            <Menu className="size-4" />
          </button>
          <span className="font-display text-sm font-semibold lg:hidden">NextRound</span>
          <div className="ml-auto flex items-center gap-1.5">
            <AlertsBell />
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-1.5 rounded-xl sm:inline-flex"
              onClick={() => setAiOpen(true)}
            >
              Pregunta a NextRound AI
            </Button>
            <Button size="sm" className="gap-1.5 rounded-xl lg:hidden" onClick={() => setNewOpen(true)}>
              <Plus className="size-3.5" />
              Nueva
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-5 pb-24 pt-2 md:px-8">{children}</main>
      </div>

      <AiAssistantButton onClick={() => setAiOpen(true)} />
      <AiAssistant open={aiOpen} onOpenChange={setAiOpen} />
      <ApplicationDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

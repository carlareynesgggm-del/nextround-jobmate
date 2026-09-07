import { Check, Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  className,
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "sidebar";
}) {
  const { lang, setLang, t } = useLanguage();
  const current = LANGUAGES.find((l) => l.code === lang) ?? { code: lang, label: "Español", short: "ES" };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Idioma")}
        className={cn(
          variant === "sidebar"
            ? "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            : "flex items-center gap-1.5 rounded-xl border border-border px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
          className,
        )}
      >
        <Globe className={cn("size-4", variant === "sidebar" ? "opacity-70" : "")} />
        {variant === "sidebar" ? (
          <span className="flex-1 text-left">{t("Idioma")}</span>
        ) : null}
        <span className={variant === "sidebar" ? "text-xs opacity-70" : ""}>{current.short}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {t("Idioma")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onSelect={() => setLang(option.code)}
            className="cursor-pointer justify-between rounded-lg text-sm"
          >
            {option.label}
            {option.code === lang ? <Check className="size-3.5 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

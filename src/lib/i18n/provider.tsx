import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { LANGUAGES, LOCALES, translate, type Lang } from "./index";

const STORAGE_KEY = "nextround.lang";

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  locale: string;
  t: (text: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

function isLang(value: unknown): value is Lang {
  return LANGUAGES.some((l) => l.code === value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) setLangState(stored);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (text: string, vars?: Record<string, string | number>) => {
      let out = translate(lang, text);
      if (vars) {
        for (const [key, value] of Object.entries(vars)) {
          out = out.replaceAll(`{${key}}`, String(value));
        }
      }
      return out;
    },
    [lang],
  );

  const value = useMemo<Ctx>(() => ({ lang, setLang, locale: LOCALES[lang], t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "es",
      setLang: () => {},
      locale: LOCALES.es,
      t: (text: string) => text,
    };
  }
  return ctx;
}

export function useT() {
  return useLanguage().t;
}

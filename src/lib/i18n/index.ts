import { chunk as core } from "./chunks/core";
import { chunk as landing } from "./chunks/landing";
import { chunk as auth } from "./chunks/auth";
import { chunk as home } from "./chunks/home";
import { chunk as applications } from "./chunks/applications";
import { chunk as detail } from "./chunks/detail";
import { chunk as tabs } from "./chunks/tabs";
import { chunk as calendar } from "./chunks/calendar";
import { chunk as vault } from "./chunks/vault";
import { chunk as insights } from "./chunks/insights";
import { chunk as misc } from "./chunks/misc";

export type Lang = "es" | "en" | "fr" | "de";

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: "es", label: "Español", short: "ES" },
  { code: "en", label: "English", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "de", label: "Deutsch", short: "DE" },
];

const CHUNKS = [
  core,
  landing,
  auth,
  home,
  applications,
  detail,
  tabs,
  calendar,
  vault,
  insights,
  misc,
];

type Triple = [string, string, string];

const MERGED: Record<string, Triple> = Object.assign({}, ...CHUNKS) as Record<string, Triple>;

const INDEX: Record<Exclude<Lang, "es">, 0 | 1 | 2> = { en: 0, fr: 1, de: 2 };

export function translate(lang: Lang, text: string): string {
  if (lang === "es") return text;
  const entry = MERGED[text];
  if (!entry) return text;
  return entry[INDEX[lang]] || text;
}

export const LOCALES: Record<Lang, string> = {
  es: "es-ES",
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
};

const DATE = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
const DATE_LONG = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const TIME = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });

export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function fmtDate(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? DATE.format(date) : "—";
}

export function fmtLongDate(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? DATE_LONG.format(date) : "—";
}

export function fmtTime(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? TIME.format(date) : "";
}

export function fmtDateTime(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? `${DATE.format(date)} · ${TIME.format(date)}` : "—";
}

export function daysFromToday(value: string | null | undefined): number | null {
  const date = toDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function relativeDay(value: string | null | undefined): string {
  const diff = daysFromToday(value);
  if (diff === null) return "—";
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff < 0) return `Hace ${Math.abs(diff)} días`;
  return `En ${diff} días`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

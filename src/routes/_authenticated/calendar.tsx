import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, PageHeader, Pill, SectionCard } from "@/components/ui-bits";
import { useApplications, useCalendar, useDeleteEvent, useSaveEvent } from "@/lib/api";
import { EVENT_KIND_LABEL, EVENT_KIND_TONE, type EventKind } from "@/lib/domain";
import { fmtDateTime, fmtTime, isSameDay, relativeDay } from "@/lib/format";
import { useLanguage, useT } from "@/lib/i18n/provider";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendario — NextRound" },
      {
        name: "description",
        content:
          "Calendario mensual con entrevistas, pruebas técnicas, seguimientos y fechas límite de tus candidaturas.",
      },
      { property: "og:title", content: "Calendario — NextRound" },
      {
        property: "og:description",
        content: "Entrevistas, pruebas y deadlines de tu búsqueda en una vista mensual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const t = useT();
  const { locale } = useLanguage();
  const { data: events = [] } = useCalendar();
  const { data: applications = [] } = useApplications();
  const deleteEvent = useDeleteEvent();
  const [cursor, setCursor] = useState(() => new Date());
  const [open, setOpen] = useState(false);

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(cursor);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [cursor]);

  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // Lunes 2024-01-01 como referencia estable
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(2024, 0, 1 + index);
      const label = formatter.format(date);
      return label.charAt(0).toUpperCase() + label.slice(1);
    });
  }, [locale]);

  const upcoming = events
    .filter((event) => new Date(event.starts_at).getTime() >= Date.now() - 3_600_000)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Calendario")}
        description={t("Entrevistas, pruebas y fechas límite de todos tus procesos.")}
        actions={
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <CalendarPlus className="size-4" /> {t("Nuevo evento")}
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <SectionCard bodyClassName="p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="font-display text-base font-semibold capitalize">{monthLabel}</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("Mes anterior")}
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
                {t("Hoy")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("Mes siguiente")}
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {weekdays.map((day) => (
              <div key={day} className="py-1.5">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const dayEvents = events.filter((event) =>
                isSameDay(new Date(event.starts_at), date),
              );
              const outside = date.getMonth() !== cursor.getMonth();
              const today = isSameDay(date, new Date());
              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[86px] rounded-lg border p-1.5 text-left ${
                    outside ? "border-transparent bg-surface-2/40" : "border-border bg-surface"
                  }`}
                >
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${
                      today
                        ? "bg-primary font-semibold text-primary-foreground"
                        : outside
                          ? "text-muted-foreground/60"
                          : "text-muted-foreground"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <p
                        key={event.id}
                        className={`truncate rounded border px-1.5 py-0.5 text-[10px] font-medium ${EVENT_KIND_TONE[event.kind]}`}
                        title={event.title}
                      >
                        {fmtTime(event.starts_at)} {event.title}
                      </p>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="px-1 text-[10px] text-muted-foreground">
                        {t("+{n} más", { n: dayEvents.length - 2 })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title={t("Próximos eventos")} bodyClassName="p-0">
          {upcoming.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState title={t("Nada agendado")} description={t("Crea tu primer evento.")} />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((event) => {
                const app = applications.find((item) => item.id === event.application_id);
                return (
                  <li key={event.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDateTime(event.starts_at)} · {relativeDay(event.starts_at)}
                        </p>
                        {app && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {app.companies?.name ?? t("Sin empresa")} · {app.role_title}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteEvent.mutate(event.id)}
                        aria-label={t("Eliminar evento")}
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <Pill tone={EVENT_KIND_TONE[event.kind]}>{t(EVENT_KIND_LABEL[event.kind])}</Pill>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <EventDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function EventDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { data: applications = [] } = useApplications();
  const saveEvent = useSaveEvent();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("interview");
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState("45");
  const [location, setLocation] = useState("");
  const [applicationId, setApplicationId] = useState("");

  const fieldClass =
    "mt-1.5 h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{t("Nuevo evento")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="e-title">{t("Título")}</Label>
            <Input
              id="e-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="e-kind">{t("Tipo")}</Label>
            <select
              id="e-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as EventKind)}
              className={fieldClass}
            >
              {(Object.keys(EVENT_KIND_LABEL) as EventKind[]).map((value) => (
                <option key={value} value={value}>
                  {t(EVENT_KIND_LABEL[value])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="e-app">{t("Candidatura")}</Label>
            <select
              id="e-app"
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              className={fieldClass}
            >
              <option value="">{t("Sin asociar")}</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.companies?.name ?? t("Sin empresa")} · {app.role_title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="e-start">{t("Fecha y hora")}</Label>
            <Input
              id="e-start"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="e-dur">{t("Duración (min)")}</Label>
            <Input
              id="e-dur"
              inputMode="numeric"
              value={duration}
              onChange={(event) => setDuration(event.target.value.replace(/\D/g, ""))}
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="e-loc">{t("Lugar / enlace")}</Label>
            <Input
              id="e-loc"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder={t("Google Meet, oficina…")}
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("Cancelar")}
          </Button>
          <Button
            onClick={async () => {
              if (!title.trim() || !startsAt) {
                toast.error(t("Añade título y fecha."));
                return;
              }
              await saveEvent.mutateAsync({
                values: {
                  title: title.trim(),
                  kind,
                  starts_at: new Date(startsAt).toISOString(),
                  duration_min: duration ? Number(duration) : 45,
                  location: location.trim() || null,
                  application_id: applicationId || null,
                },
              });
              toast.success(t("Evento creado"));
              setTitle("");
              setStartsAt("");
              setLocation("");
              onOpenChange(false);
            }}
          >
            {t("Guardar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

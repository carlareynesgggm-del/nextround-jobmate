import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pin, PinOff, Plus, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageHeader, Pill, SectionCard } from "@/components/ui-bits";
import { useApplications, useDeleteNote, useNotes, useSaveNote } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({
    meta: [
      { title: "Notas — NextRound" },
      {
        name: "description",
        content:
          "Notas de entrevistas, feedback y preguntas clave, ancladas y vinculadas a cada candidatura.",
      },
      { property: "og:title", content: "Notas — NextRound" },
      {
        property: "og:description",
        content: "Guarda feedback, preguntas y aprendizajes de cada proceso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const t = useT();
  const { data: notes = [] } = useNotes();
  const { data: applications = [] } = useApplications();
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [applicationId, setApplicationId] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader title={t("Notas")} description={t("{n} notas guardadas.", { n: notes.length })} />

      <SectionCard title={t("Nueva nota")}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="n-title">{t("Título")}</Label>
            <Input
              id="n-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("Feedback de la 2ª ronda")}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="n-app">{t("Candidatura")}</Label>
            <select
              id="n-app"
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <option value="">{t("Sin candidatura")}</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.companies?.name ?? t("Sin empresa")} · {app.role_title}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="n-body">{t("Contenido")}</Label>
            <Textarea
              id="n-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              className="mt-1.5"
            />
          </div>
        </div>
        <Button
          className="mt-3 gap-1.5"
          onClick={async () => {
            if (!body.trim()) {
              toast.error(t("Escribe el contenido de la nota."));
              return;
            }
            await saveNote.mutateAsync({
              values: {
                title: title.trim() || null,
                body: body.trim(),
                application_id: applicationId || null,
              },
            });
            setTitle("");
            setBody("");
            toast.success(t("Nota guardada"));
          }}
        >
          <Plus className="size-4" /> {t("Guardar nota")}
        </Button>
      </SectionCard>

      {notes.length === 0 ? (
        <EmptyState
          title={t("Sin notas")}
          description={t("Apunta lo que aprendes en cada conversación.")}
          icon={<StickyNote className="size-6" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => {
            const app = applications.find((item) => item.id === note.application_id);
            return (
              <SectionCard key={note.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-semibold">
                      {note.title ?? t("Nota")}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">{fmtDate(note.updated_at)}</p>
                  </div>
                  <button
                    onClick={() => saveNote.mutate({ id: note.id, values: { pinned: !note.pinned } })}
                    aria-label={t("Anclar nota")}
                    className={note.pinned ? "text-gold" : "text-muted-foreground"}
                  >
                    {note.pinned ? <Pin className="size-4" /> : <PinOff className="size-4" />}
                  </button>
                </div>
                <p className="mt-2.5 line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed">
                  {note.body}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  {app ? <Pill>{app.companies?.name ?? app.role_title}</Pill> : <span />}
                  <button
                    onClick={() => deleteNote.mutate(note.id)}
                    aria-label={t("Eliminar nota")}
                    className="text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

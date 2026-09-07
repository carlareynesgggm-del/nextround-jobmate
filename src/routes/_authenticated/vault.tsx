import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader, Pill, SectionCard } from "@/components/ui-bits";
import {
  documentUrl,
  useDeleteDocument,
  useDocuments,
  useSetDefaultDocument,
  useUploadDocument,
} from "@/lib/api";
import { DOC_KIND_LABEL, type DocKind, type DocumentRow } from "@/lib/domain";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({
    meta: [
      { title: "CV Vault — NextRound" },
      {
        name: "description",
        content:
          "Guarda versiones de tu CV, cartas y portfolio, marca el documento por defecto y descárgalo cuando lo necesites.",
      },
      { property: "og:title", content: "CV Vault — NextRound" },
      {
        property: "og:description",
        content: "Todas las versiones de tu CV y documentos de candidatura en un sitio seguro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VaultPage,
});

function VaultPage() {
  const { data: documents = [] } = useDocuments();
  const upload = useUploadDocument();
  const remove = useDeleteDocument();
  const setDefault = useSetDefaultDocument();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<DocKind>("cv");
  const [version, setVersion] = useState("");

  async function openDocument(doc: DocumentRow) {
    if (!doc.storage_path) {
      toast.error("Este documento no tiene archivo adjunto.");
      return;
    }
    const url = await documentUrl(doc.storage_path);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("No se pudo abrir el documento.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CV Vault"
        description="Versiones de tu CV, cartas de presentación y portfolio, siempre a mano."
      />

      <SectionCard title="Subir documento" subtitle="PDF, DOCX o imagen (máx. 20 MB)">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="d-file">Archivo</Label>
            <Input
              id="d-file"
              type="file"
              className="mt-1.5"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                if (selected && !name) setName(selected.name.replace(/\.[^.]+$/, ""));
              }}
            />
          </div>
          <div>
            <Label htmlFor="d-name">Nombre</Label>
            <Input
              id="d-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="CV Producto 2026"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="d-kind">Tipo</Label>
            <select
              id="d-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as DocKind)}
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {(Object.keys(DOC_KIND_LABEL) as DocKind[]).map((value) => (
                <option key={value} value={value}>
                  {DOC_KIND_LABEL[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="d-version">Versión</Label>
            <Input
              id="d-version"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="v3"
              className="mt-1.5"
            />
          </div>
        </div>
        <Button
          className="mt-3 gap-1.5"
          disabled={upload.isPending}
          onClick={async () => {
            if (!file) {
              toast.error("Selecciona un archivo.");
              return;
            }
            try {
              await upload.mutateAsync({
                file,
                name: name.trim() || file.name,
                kind,
                version: version.trim(),
              });
              toast.success("Documento subido");
              setFile(null);
              setName("");
              setVersion("");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "No se pudo subir");
            }
          }}
        >
          <Upload className="size-4" /> {upload.isPending ? "Subiendo…" : "Subir"}
        </Button>
      </SectionCard>

      {documents.length === 0 ? (
        <EmptyState
          title="Vault vacío"
          description="Sube tu CV para tenerlo listo en cada candidatura."
          icon={<FileText className="size-6" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <SectionCard key={doc.id}>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-sm font-semibold">{doc.name}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtDate(doc.created_at)}
                    {doc.size_bytes ? ` · ${Math.round(doc.size_bytes / 1024)} KB` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill>{DOC_KIND_LABEL[doc.kind]}</Pill>
                {doc.version && <Pill>{doc.version}</Pill>}
                {doc.is_default && (
                  <Pill tone="border-gold/35 bg-gold/15 text-gold-foreground">Por defecto</Pill>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => openDocument(doc)}
                >
                  <Download className="size-3.5" /> Abrir
                </Button>
                {!doc.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setDefault.mutate(doc)}
                  >
                    <Star className="size-3.5" /> Por defecto
                  </Button>
                )}
                <button
                  onClick={() => remove.mutate(doc)}
                  aria-label="Eliminar documento"
                  className="ml-auto text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

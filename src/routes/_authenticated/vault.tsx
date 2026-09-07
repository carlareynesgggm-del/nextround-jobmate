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
import { useT } from "@/lib/i18n/provider";

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
  const t = useT();
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
      toast.error(t("Este documento no tiene archivo adjunto."));
      return;
    }
    const url = await documentUrl(doc.storage_path);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error(t("No se pudo abrir el documento."));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("CV Vault")}
        description={t("Versiones de tu CV, cartas de presentación y portfolio, siempre a mano.")}
      />

      <SectionCard title={t("Subir documento")} subtitle={t("PDF, DOCX o imagen (máx. 20 MB)")}>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="d-file">{t("Archivo")}</Label>
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
            <Label htmlFor="d-name">{t("Nombre")}</Label>
            <Input
              id="d-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("CV Producto 2026")}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="d-kind">{t("Tipo")}</Label>
            <select
              id="d-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as DocKind)}
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {(Object.keys(DOC_KIND_LABEL) as DocKind[]).map((value) => (
                <option key={value} value={value}>
                  {t(DOC_KIND_LABEL[value])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="d-version">{t("Versión")}</Label>
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
              toast.error(t("Selecciona un archivo."));
              return;
            }
            try {
              await upload.mutateAsync({
                file,
                name: name.trim() || file.name,
                kind,
                version: version.trim(),
              });
              toast.success(t("Documento subido"));
              setFile(null);
              setName("");
              setVersion("");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : t("No se pudo subir"));
            }
          }}
        >
          <Upload className="size-4" /> {upload.isPending ? t("Subiendo…") : t("Subir")}
        </Button>
      </SectionCard>

      {documents.length === 0 ? (
        <EmptyState
          title={t("Vault vacío")}
          description={t("Sube tu CV para tenerlo listo en cada candidatura.")}
          icon={<FileText className="size-6" />}
        />
      ) : (
        <div className="space-y-8">
          {groupDocuments(documents).map((group) => (
            <section key={group.key}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-semibold tracking-tight">{group.title}</h2>
                <Pill>{t(DOC_KIND_LABEL[group.kind])}</Pill>
                <Pill>
                  {group.docs.length} {t(group.docs.length === 1 ? "versión" : "versiones")}
                </Pill>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto gap-1.5"
                  onClick={() => {
                    setKind(group.kind);
                    setName(group.title);
                    setVersion(`v${group.docs.length + 1}`);
                    document.getElementById("d-file")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Upload className="size-3.5" /> {t("Nueva versión")}
                </Button>
              </div>

              <ul className="mt-3 divide-y divide-border rounded-2xl bg-surface px-4 shadow-soft">
                {group.docs.map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-center gap-3 py-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet/10 text-violet">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {doc.version || t("Versión inicial")}
                        {doc.is_default && (
                          <span className="ml-2 rounded-full border border-violet/30 bg-violet/10 px-1.5 py-0.5 text-[10px] font-medium text-violet">
                            {t("En uso")}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {doc.name} · {fmtDate(doc.created_at)}
                        {doc.size_bytes ? ` · ${Math.round(doc.size_bytes / 1024)} KB` : ""}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-xl"
                      onClick={() => openDocument(doc)}
                    >
                      <Download className="size-3.5" /> {t("Abrir")}
                    </Button>
                    {!doc.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setDefault.mutate(doc)}
                      >
                        <Star className="size-3.5" /> {t("Usar por defecto")}
                      </Button>
                    )}
                    <button
                      onClick={() => remove.mutate(doc)}
                      aria-label={t("Eliminar documento")}
                      className="text-muted-foreground transition-colors hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

type DocGroup = { key: string; title: string; kind: DocKind; docs: DocumentRow[] };

/** Agrupa documentos por nombre base para que las versiones de un mismo CV vivan juntas. */
function groupDocuments(documents: DocumentRow[]): DocGroup[] {
  const groups = new Map<string, DocGroup>();
  for (const doc of documents) {
    const title = doc.name.replace(/[\s_-]*v?\d+(\.\d+)?$/i, "").trim() || doc.name;
    const key = `${doc.kind}:${title.toLowerCase()}`;
    const group = groups.get(key) ?? { key, title, kind: doc.kind, docs: [] };
    group.docs.push(doc);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    docs: group.docs.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
  }));
}

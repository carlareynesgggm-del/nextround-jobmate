import { useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUploadDocument } from "@/lib/api";
import type { DocKind, DocumentRow } from "@/lib/domain";
import { useT } from "@/lib/i18n/provider";

/**
 * Botón reutilizable para subir un documento desde el ordenador sin salir de la
 * pantalla actual. Reutiliza la mutación del CV Vault y devuelve el documento
 * creado para que la pantalla lo seleccione o lo vincule.
 */
export function QuickDocumentUpload({
  kind,
  onUploaded,
  label,
  className,
}: {
  kind: DocKind;
  onUploaded: (doc: DocumentRow) => void;
  label?: string;
  className?: string;
}) {
  const t = useT();
  const upload = useUploadDocument();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            const doc = (await upload.mutateAsync({
              file,
              name: file.name.replace(/\.[^.]+$/, ""),
              kind,
              version: "",
            })) as DocumentRow;
            toast.success(t("Documento subido"));
            onUploaded(doc);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : t("No se pudo subir"));
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className ?? "gap-1.5"}
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" />
        {upload.isPending ? t("Subiendo…") : (label ?? t("Subir desde el ordenador"))}
      </Button>
    </>
  );
}

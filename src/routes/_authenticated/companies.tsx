import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompanyMark, EmptyState, PageHeader, Pill, SectionCard } from "@/components/ui-bits";
import { useApplications, useCompanies, useContacts, useSaveCompany } from "@/lib/api";
import { STAGE_META, type CompanyRow } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({
    meta: [
      { title: "Empresas — NextRound" },
      {
        name: "description",
        content:
          "Directorio de empresas con sector, ubicación, contactos y las candidaturas asociadas a cada una.",
      },
      { property: "og:title", content: "Empresas — NextRound" },
      {
        property: "og:description",
        content: "Empresas, contactos y candidaturas asociadas en un directorio propio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { data: companies = [], isLoading } = useCompanies();
  const { data: applications = [] } = useApplications();
  const { data: contacts = [] } = useContacts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyRow | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description={`${companies.length} empresas en tu radar.`}
        actions={
          <Button
            className="gap-1.5"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Nueva empresa
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          title="Sin empresas"
          description="Añade las empresas que te interesan para agrupar candidaturas y contactos."
          icon={<Building2 className="size-6" />}
          action={
            <Button className="gap-1.5" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Nueva empresa
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => {
            const apps = applications.filter((app) => app.company_id === company.id);
            const people = contacts.filter((contact) => contact.company_id === company.id);
            return (
              <SectionCard key={company.id}>
                <div className="flex items-start gap-3">
                  <CompanyMark name={company.name} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-semibold">
                      {company.name}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {company.industry ?? "Sector sin definir"}
                      {company.location ? ` · ${company.location}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Pill>{apps.length} candidaturas</Pill>
                  <Pill>{people.length} contactos</Pill>
                  {company.size && <Pill>{company.size}</Pill>}
                </div>

                {apps.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                    {apps.slice(0, 3).map((app) => (
                      <li key={app.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate">{app.role_title}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {STAGE_META[app.stage].short}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(company);
                      setOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  {company.website && (
                    <Button asChild variant="ghost" size="sm" className="gap-1.5">
                      <a href={company.website} target="_blank" rel="noreferrer">
                        Web <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <CompanyDialog open={open} onOpenChange={setOpen} company={editing} />
    </div>
  );
}

function CompanyDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyRow | null;
}) {
  const saveCompany = useSaveCompany();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [size, setSize] = useState("");
  const [notes, setNotes] = useState("");

  function sync() {
    setName(company?.name ?? "");
    setIndustry(company?.industry ?? "");
    setLocation(company?.location ?? "");
    setWebsite(company?.website ?? "");
    setSize(company?.size ?? "");
    setNotes(company?.notes ?? "");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) sync();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {company ? "Editar empresa" : "Nueva empresa"}
          </DialogTitle>
          <DialogDescription>
            Guarda el contexto de la empresa para tenerlo a mano en cada proceso.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="c-name">Nombre</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="c-industry">Sector</Label>
            <Input
              id="c-industry"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="c-location">Ubicación</Label>
            <Input
              id="c-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="c-size">Tamaño</Label>
            <Input
              id="c-size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              placeholder="50-200"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="c-web">Web</Label>
            <Input
              id="c-web"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://…"
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="c-notes">Notas</Label>
            <Textarea
              id="c-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (!name.trim()) {
                toast.error("La empresa necesita un nombre.");
                return;
              }
              await saveCompany.mutateAsync({
                ...(company ? { id: company.id } : {}),
                values: {
                  name: name.trim(),
                  industry: industry.trim() || null,
                  location: location.trim() || null,
                  website: website.trim() || null,
                  size: size.trim() || null,
                  notes: notes.trim() || null,
                },
              });
              toast.success("Empresa guardada");
              onOpenChange(false);
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

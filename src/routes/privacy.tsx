import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad — NextRound" },
      {
        name: "description",
        content:
          "Política de privacidad de NextRound: cómo recopilamos, usamos y protegemos tus datos.",
      },
      { property: "og:title", content: "Política de Privacidad — NextRound" },
      {
        property: "og:description",
        content:
          "Conoce cómo NextRound gestiona tu información personal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-foreground hover:text-primary"
          >
            NextRound
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: 17 de septiembre de 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Responsable del tratamiento</h2>
            <p className="mt-2">
              El responsable del tratamiento de los datos personales recogidos a través de NextRound
              es la entidad titular de la aplicación. Para cualquier consulta sobre privacidad puedes
              escribir a{" "}
              <a
                href="mailto:carlareynesgggm@gmail.com"
                className="text-primary underline underline-offset-2"
              >
                carlareynesgggm@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Datos que recopilamos</h2>
            <p className="mt-2">
              Recopilamos únicamente los datos necesarios para que puedas gestionar tu búsqueda de
              empleo: dirección de correo electrónico, nombre, información sobre tus candidaturas,
              empresas, contactos, eventos de calendario, notas, documentos que subas y, de forma
              opcional, correos electrónicos procesados a través de la integración con Gmail cuando
              decides conectar tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Finalidad del tratamiento</h2>
            <p className="mt-2">
              Utilizamos tus datos para ofrecerte el servicio de seguimiento de candidaturas,
              preparación de entrevistas, gestión de documentos y recordatorios. No vendemos tus datos
              a terceros ni los utilizamos para publicidad personalizada.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Integración con Gmail</h2>
            <p className="mt-2">
              Si conectas tu cuenta de Gmail, NextRound accede únicamente en modo lectura
              (<code className="rounded bg-muted px-1 py-0.5 text-xs">gmail.readonly</code>) para
              detectar correos relacionados con tus procesos de selección. Nunca enviamos correos en
              tu nombre ni compartimos el contenido de tus mensajes con terceros. Puedes desconectar
              Gmail en cualquier momento desde la configuración.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Almacenamiento y seguridad</h2>
            <p className="mt-2">
              Los datos se almacenan en infraestructura cloud con acceso restringido al usuario
              autenticado. Los tokens de acceso a Gmail se cifran antes de guardarse y solo el
              usuario propietario puede gestionar su información.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Tus derechos</h2>
            <p className="mt-2">
              Puedes acceder, rectificar, exportar o eliminar tus datos en cualquier momento. Para
              ejercer tus derechos, contacta a través del correo indicado arriba.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Cambios en esta política</h2>
            <p className="mt-2">
              Podemos actualizar esta política para reflejar cambios en el servicio o en la normativa
              aplicable. Publicaremos la nueva versión en esta misma página.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

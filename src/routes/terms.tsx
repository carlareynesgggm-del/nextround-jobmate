import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Condiciones del Servicio — NextRound" },
      {
        name: "description",
        content:
          "Condiciones del servicio de NextRound: uso de la plataforma, responsabilidades y normas aplicables.",
      },
      { property: "og:title", content: "Condiciones del Servicio — NextRound" },
      {
        property: "og:description",
        content:
          "Lee las condiciones de uso de NextRound.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          Condiciones del Servicio
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: 17 de septiembre de 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Aceptación de las condiciones</h2>
            <p className="mt-2">
              Al registrarte o utilizar NextRound, aceptas estas Condiciones del Servicio. Si no estás
              de acuerdo, no uses la aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Descripción del servicio</h2>
            <p className="mt-2">
              NextRound es una herramienta de organización personal para la búsqueda de empleo. Te
              permite registrar candidaturas, guardar documentos, añadir notas, eventos de calendario
              y, opcionalmente, analizar correos de Gmail para detectar novedades de tus procesos de
              selección.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Uso permitido</h2>
            <p className="mt-2">
              Te comprometes a usar NextRound de forma lícita y responsable. No puedes utilizar la
              plataforma para almacenar o procesar información ilegal, suplantar a terceros ni
              interferir en el funcionamiento del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Cuenta y seguridad</h2>
            <p className="mt-2">
              Eres responsable de mantener la confidencialidad de tu cuenta. NextRound no solicita
              contraseñas de correo ni de portales de empleo; cualquier dato sensible que decidas
              añadir en notas o campos libres es responsabilidad tuya.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Propiedad intelectual</h2>
            <p className="mt-2">
              NextRound, su código, diseño y marca son propiedad del titular del proyecto. Tú
              conservas todos los derechos sobre los datos que introduzcas en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Limitación de responsabilidad</h2>
            <p className="mt-2">
              NextRound se proporciona "tal cual". No garantizamos que la integración con Gmail
              detecte todos los correos relevantes ni que las sugerencias de IA sean siempre
              exactas. Revistas siempre las propuestas antes de confirmar cambios importantes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Modificaciones y baja</h2>
            <p className="mt-2">
              Podemos modificar estas condiciones o el servicio en cualquier momento. Puedes dar de
              baja tu cuenta y eliminar tus datos contactando a{" "}
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
            <h2 className="text-lg font-semibold text-foreground">8. Ley aplicable</h2>
            <p className="mt-2">
              Estas condiciones se rigen por la legislación española. Para cualquier disputa, ambas
              partes se someterán a los tribunales competentes.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

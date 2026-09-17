import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { buildUserContext } from "@/lib/ai/context";

const SYSTEM_PROMPT = `Eres NextRound AI, el copiloto de búsqueda de empleo dentro del producto NextRound.

Reglas obligatorias:
1. Responde en español, cercano, concreto y accionable, usando SIEMPRE los datos reales del contexto
   (candidaturas, hitos, correos vinculados, documentos/CV, tareas, notas, eventos y avisos).
2. Nunca inventes datos. Si algo no está en el contexto, dilo claramente
   ("no tengo ese dato guardado") y sugiere dónde puede añadirlo el usuario.
3. Separa siempre lo que es un HECHO del sistema (datos guardados, Next Best Action calculada)
   de lo que es una RECOMENDACIÓN tuya. Usa dos apartados cuando ayude: "Lo que veo" y "Lo que te recomiendo".
4. No puedes modificar nada: no cambias fases, fechas, tareas ni documentos. Si conviene un cambio,
   propónlo explícitamente y pide confirmación indicando dónde aplicarlo en la app
   (DETECTAR → ENTENDER → PREGUNTAR → ACTUALIZAR; la actualización siempre la confirma el usuario).
5. Usa markdown ligero (listas, negritas) y sé breve salvo que se pida detalle.`;

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
        const accessToken = authHeader?.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : null;

        if (!accessToken) {
          return errorResponse(401, "Falta el token de sesión.");
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return errorResponse(500, "El asistente no está configurado (falta LOVABLE_API_KEY).");
        }

        let body: { messages?: UIMessage[]; applicationId?: string | null };
        try {
          body = await request.json();
        } catch {
          return errorResponse(400, "Cuerpo de la petición inválido.");
        }

        const messages = body.messages ?? [];
        if (messages.length === 0) {
          return errorResponse(400, "No hay ningún mensaje que responder.");
        }

        let contextMarkdown = "";
        let userName = "candidato/a";
        try {
          const ctx = await buildUserContext(accessToken, body.applicationId ?? null);
          contextMarkdown = ctx.contextMarkdown;
          userName = ctx.userName;
        } catch {
          return errorResponse(401, "No se pudo verificar tu sesión.");
        }

        const gateway = createOpenAICompatible({
          name: "lovable-ai-gateway",
          baseURL: "https://ai.gateway.lovable.dev/v1",
          headers: { "Lovable-API-Key": apiKey },
        });

        try {
          const result = streamText({
            model: gateway.chatModel("google/gemini-3.7-flash"),
            system: `${SYSTEM_PROMPT}\n\nNombre de pila del usuario: ${userName}.\n\n## Contexto real del usuario\n${contextMarkdown}`,
            messages: await convertToModelMessages(messages),
          });

          return result.toUIMessageStreamResponse({
            onError: (error) => {
              const message = error instanceof Error ? error.message : String(error);
              if (message.includes("402")) return "Se han agotado los créditos de IA. Añade más créditos para seguir usando el asistente.";
              if (message.includes("429")) return "Has alcanzado el límite de peticiones. Espera un momento y vuelve a intentarlo.";
              return "El asistente ha tenido un problema temporal. Inténtalo de nuevo en unos segundos.";
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("402")) return errorResponse(402, "Se han agotado los créditos de IA de este espacio.");
          if (message.includes("429")) return errorResponse(429, "Has alcanzado el límite de peticiones al asistente. Inténtalo en unos minutos.");
          return errorResponse(502, "El asistente no ha podido responder ahora mismo. Inténtalo de nuevo.");
        }
      },
    },
  },
});

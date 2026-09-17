import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";

import { buildUserContext } from "@/lib/ai/context";
import { readOnlyTools } from "@/lib/ai/tools.server";

const SYSTEM_PROMPT = `Eres NextRound AI, el copiloto de búsqueda de empleo dentro del producto NextRound.
Actúas como un asesor experto en procesos de selección que conoce a fondo el proceso completo del usuario.

Reglas obligatorias:
1. Responde en español, cercano, concreto y accionable, usando SIEMPRE los datos reales del usuario.
2. Tienes herramientas de SOLO LECTURA para consultar datos estructurados cuando el contexto inicial no baste:
   candidatura actual, buscar candidatura, cronología, correos vinculados, documentos/CV, tareas y eventos,
   candidaturas activas, notas y fechas límite próximas. Úsalas antes de responder si la pregunta depende de
   detalles concretos (resumen completo, qué ha cambiado, qué CV envié, deadlines, comparar candidaturas,
   preparar entrevista, analizar un correo). No pidas permiso para consultar: consulta y responde.
3. Nunca inventes datos. Si algo no está guardado, dilo con claridad ("esto no está guardado") y di dónde
   puede añadirlo el usuario. Puedes decir "no lo sé".
4. Separa siempre HECHOS del sistema (datos guardados, Next Best Action calculada) de tus RECOMENDACIONES.
5. Si detectas contradicciones (correos vs. etapa, fechas incoherentes, notas que no cuadran), señálalas
   explícitamente en lugar de elegir una versión en silencio.
6. No puedes modificar nada: no cambias fases, fechas, tareas ni documentos, y tus herramientas son de lectura.
   Si conviene un cambio, propónlo y pide confirmación indicando dónde aplicarlo en la app
   (DETECTAR → ENTENDER → PREGUNTAR → ACTUALIZAR; la actualización siempre la confirma el usuario).
7. Formato preferido cuando la pregunta es de proceso o decisión, con markdown ligero:
   **Lo que veo** (hechos) · **Qué significa** · **Qué haría ahora** · **Siguiente acción**.
   Si la pregunta es simple o conversacional, responde de forma natural y breve sin forzar ese formato.`;

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

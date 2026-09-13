import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Devuelve la URL de consentimiento de Google para el usuario autenticado. */
export const startGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { origin: string; redirect?: string }) => input)
  .handler(async ({ data, context }) => {
    const { authorizeUrl, signState } = await import("@/lib/inbox/gmail.server");
    const state = signState({
      uid: context.userId,
      exp: Date.now() + 10 * 60 * 1000,
      redirect: data.redirect ?? "/settings",
    });
    return { url: authorizeUrl(data.origin, state) };
  });

/** Primera sincronización real: detecta correos de proceso y crea sugerencias. */
export const syncGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { accessTokenFromRefresh, decryptToken, fetchRecruitmentMessages } = await import(
      "@/lib/inbox/gmail.server"
    );
    const { classify, matchApplication } = await import("@/lib/inbox/classify.server");

    const { data: connection } = await supabase
      .from("email_connections")
      .select("*")
      .eq("provider", "gmail")
      .maybeSingle();

    if (!connection?.connection_key_ciphertext) {
      throw new Error("Todavía no hay ninguna cuenta de Gmail conectada.");
    }

    let messages;
    try {
      const accessToken = await accessTokenFromRefresh(decryptToken(connection.connection_key_ciphertext));
      messages = await fetchRecruitmentMessages(accessToken, 25);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al leer Gmail.";
      await supabase
        .from("email_connections")
        .update({ status: "error", last_error: message })
        .eq("id", connection.id);
      throw new Error(message);
    }

    const { data: existing } = await supabase.from("email_events").select("message_id");
    const seen = new Set((existing ?? []).map((row) => row.message_id));

    const { data: apps } = await supabase
      .from("applications")
      .select("id, role_title, companies(name)")
      .eq("archived", false);

    const targets = (apps ?? []).map((app) => ({
      id: app.id,
      role_title: app.role_title,
      company: (app.companies as { name: string } | null)?.name ?? null,
    }));

    let detected = 0;

    for (const message of messages) {
      if (seen.has(message.id)) continue;
      const classification = classify(message);
      if (!classification) continue;

      const match = matchApplication(message, classification, targets);
      const isNewApplication =
        !match.id && classification.emailType === "application_confirmation";

      const { data: event, error } = await supabase
        .from("email_events")
        .insert({
          user_id: userId,
          provider: "gmail",
          message_id: message.id,
          thread_id: message.threadId,
          from_name: message.fromName,
          from_email: message.fromEmail,
          subject: message.subject,
          snippet: message.snippet,
          received_at: new Date(Number(message.internalDate)).toISOString(),
          email_type: classification.emailType,
          confidence: classification.confidence,
          extracted: classification.extracted as never,
          application_id: match.id,
          status: match.id ? "pending" : "needs_match",
        })
        .select("id")
        .single();

      if (error || !event) continue;
      detected += 1;

      const suggestions = classification.suggestions.map((suggestion, index) => ({
        user_id: userId,
        email_event_id: event.id,
        application_id: match.id,
        kind: suggestion.kind,
        label: suggestion.label,
        detail: suggestion.detail ?? null,
        payload: suggestion.payload as never,
        position: index,
      }));

      if (isNewApplication) {
        suggestions.push({
          user_id: userId,
          email_event_id: event.id,
          application_id: null,
          kind: "new_application",
          label: `Crear la candidatura${classification.extracted.company ? ` en ${classification.extracted.company}` : ""}`,
          detail: "Detectada una confirmación de una candidatura que no tienes guardada.",
          payload: {
            company: classification.extracted.company,
            role_title: classification.extracted.role ?? message.subject,
            stage: "applied",
            source: "email",
            candidate_portal_url: classification.extracted.portal_url ?? null,
          } as never,
          position: suggestions.length,
        });
      }

      await supabase.from("email_suggestions").insert(suggestions);
    }

    await supabase
      .from("email_connections")
      .update({ last_sync_at: new Date().toISOString(), status: "connected", last_error: null })
      .eq("id", connection.id);

    return { scanned: messages.length, detected };
  });

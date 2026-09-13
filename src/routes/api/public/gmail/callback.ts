import { createFileRoute } from "@tanstack/react-router";

import {
  exchangeCode,
  googleEmailAddress,
  encryptToken,
  verifyState,
  GMAIL_SCOPES,
} from "@/lib/inbox/gmail.server";

function back(origin: string, path: string, status: string) {
  const url = new URL(path, origin);
  url.searchParams.set("gmail", status);
  return new Response(null, { status: 302, headers: { location: url.toString() } });
}

export const Route = createFileRoute("/api/public/gmail/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        const verified = state ? verifyState(state) : null;
        if (!verified) return back(origin, "/settings", "state_error");
        if (url.searchParams.get("error") || !code) {
          return back(origin, verified.redirect, "cancelled");
        }

        try {
          const tokens = await exchangeCode(code, origin);
          if (!tokens.refresh_token || !tokens.access_token) {
            return back(origin, verified.redirect, "no_refresh_token");
          }

          const email = await googleEmailAddress(tokens.access_token);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { error } = await supabaseAdmin.from("email_connections").upsert(
            {
              user_id: verified.uid,
              provider: "gmail",
              email_address: email,
              status: "connected",
              scope: tokens.scope ?? GMAIL_SCOPES.join(" "),
              connection_key_ciphertext: encryptToken(tokens.refresh_token),
              last_error: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,provider" },
          );
          if (error) throw new Error(error.message);

          return back(origin, verified.redirect, "connected");
        } catch (error) {
          console.error("Gmail callback failed", error);
          return back(origin, verified.redirect, "error");
        }
      },
    },
  },
});

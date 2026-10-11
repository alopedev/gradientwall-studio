import type { FetchLike } from "./loops";
import type { SupabaseConfig } from "./supabase-orders";

/**
 * The email list in Supabase Postgres. One call to the `subscribe_email` SQL
 * function (`supabase/migrations/*_subscribers.sql`) through PostgREST RPC with
 * the secret key, like the order store. Server-side only.
 */
export interface SubscriberStore {
  /** Adds the address (idempotent). Does not say whether it was already there. */
  subscribe(opts: { email: string; source: string; consentText: string }): Promise<void>;
}

export function supabaseSubscriberStore(
  cfg: SupabaseConfig,
  fetchImpl: FetchLike = fetch,
): SubscriberStore {
  const base = cfg.url.replace(/\/+$/, "");
  const headers: Record<string, string> = {
    apikey: cfg.secretKey,
    "Content-Type": "application/json",
  };
  // New `sb_*` keys are not JWTs and must not be sent as a bearer token.
  if (!cfg.secretKey.startsWith("sb_")) headers.Authorization = `Bearer ${cfg.secretKey}`;

  return {
    async subscribe({ email, source, consentText }) {
      const res = await fetchImpl(`${base}/rest/v1/rpc/subscribe_email`, {
        method: "POST",
        headers,
        body: JSON.stringify({ p_email: email, p_source: source, p_consent_text: consentText }),
      });
      if (!res.ok) {
        // The body can echo the address (constraint errors): keep it out of the message.
        throw new Error(`Supabase rpc subscribe_email failed: ${res.status}`);
      }
    },
  };
}

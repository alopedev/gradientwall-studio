import type { FetchLike } from "./loops";
import type { ConsumeResult, ExtendResult, OrderRecord, OrderStore } from "./orders-store";

/**
 * Orders in Supabase Postgres. Every operation is one call to a SQL function
 * from `supabase/migrations/*_orders.sql` through the PostgREST RPC endpoint,
 * so the read-decide-write of a download happens inside the database under a
 * row lock (no compare-and-set loop here). Wraps fetch directly, like
 * `loops.ts`, to keep the function bundle small.
 *
 * Server-side only: it needs the project's secret key, which bypasses RLS.
 */
export interface SupabaseConfig {
  /** Project URL, e.g. `https://abcd.supabase.co`. */
  url: string;
  /** Secret key (`sb_secret_…`) or the legacy `service_role` JWT. */
  secretKey: string;
}

export function supabaseOrderStore(cfg: SupabaseConfig, fetchImpl: FetchLike = fetch): OrderStore {
  const base = cfg.url.replace(/\/+$/, "");
  const headers: Record<string, string> = {
    apikey: cfg.secretKey,
    "Content-Type": "application/json",
  };
  // New `sb_*` keys are not JWTs and must not be sent as a bearer token; the
  // gateway derives the role from `apikey`. Legacy keys need both headers.
  if (!cfg.secretKey.startsWith("sb_")) headers.Authorization = `Bearer ${cfg.secretKey}`;

  async function rpc(fn: string, args: Record<string, unknown>): Promise<unknown> {
    const res = await fetchImpl(`${base}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers,
      body: JSON.stringify(args),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`Supabase rpc ${fn} failed: ${res.status} ${text}`);
    return text ? JSON.parse(text) : null;
  }

  return {
    async get(orderId) {
      return (await rpc("get_order", { p_order_id: orderId })) as OrderRecord | null;
    },
    async put(o) {
      await rpc("put_order", {
        p_order_id: o.orderId,
        p_pack_slug: o.packSlug,
        p_email: o.email,
        p_downloads_remaining: o.downloadsRemaining,
        p_expires_at: o.expiresAt,
        p_created_at: o.createdAt,
      });
    },
    async consumeDownload(orderId, now) {
      return (await rpc("consume_download", { p_order_id: orderId, p_now: now })) as ConsumeResult;
    },
    async extendDeadline(orderId, now, ttl) {
      return (await rpc("extend_deadline", {
        p_order_id: orderId,
        p_now: now,
        p_ttl_seconds: ttl,
      })) as ExtendResult;
    },
  };
}

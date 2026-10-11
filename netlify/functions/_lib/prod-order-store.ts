import { type EnvSource, readOrdersStoreEnv } from "./env";
import { kvOrderStore, netlifyBlobsBackend, type OrderStore } from "./orders-store";
import { supabaseOrderStore } from "./supabase-orders";

/** The order store the deployed functions use: Supabase if configured, else Netlify Blobs. */
export function prodOrderStore(source: EnvSource = process.env): OrderStore {
  const supabase = readOrdersStoreEnv(source);
  return supabase ? supabaseOrderStore(supabase) : kvOrderStore(netlifyBlobsBackend());
}

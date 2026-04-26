import { getStore } from "@netlify/blobs";

/**
 * Storage backend abstraction. Functions in this module take a backend so
 * tests can swap a real Netlify Blobs store for an in-memory fake. Production
 * uses `netlifyBlobsBackend()`.
 */
export interface KVBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export function netlifyBlobsBackend(): KVBackend {
  const store = getStore("orders");
  return {
    get: async (key) => (await store.get(key, { type: "text" })) ?? null,
    set: async (key, value) => {
      await store.set(key, value);
    },
  };
}

/** In-memory backend for tests + local dev when Blobs context isn't wired up. */
export function inMemoryBackend(seed: Record<string, string> = {}): KVBackend {
  const map = new Map(Object.entries(seed));
  return {
    get: async (k) => map.get(k) ?? null,
    set: async (k, v) => {
      map.set(k, v);
    },
  };
}

export interface OrderRecord {
  orderId: string;
  packSlug: string;
  email: string;
  downloadsRemaining: number;
  /** Epoch seconds. Mirrors JWT exp — kept here too so /recover can decide independently. */
  expiresAt: number;
  /** Epoch seconds at order creation. */
  createdAt: number;
}

export async function putOrder(b: KVBackend, o: OrderRecord): Promise<void> {
  await b.set(o.orderId, JSON.stringify(o));
}

export async function getOrder(b: KVBackend, orderId: string): Promise<OrderRecord | null> {
  const raw = await b.get(orderId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderRecord;
  } catch {
    return null;
  }
}

export type ConsumeResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: "not_found" | "exhausted" | "expired" };

/**
 * Atomic-from-the-caller's-POV decrement: read, check, write back. Netlify
 * Blobs has no transactional CAS so a concurrent double-click could double-
 * decrement; the impact is one extra download in a 5-allowance budget,
 * which is acceptable for the MVP. Hardening (CAS via etag, or a Durable
 * Object) is a follow-up if abuse appears in telemetry.
 */
export async function consumeDownload(b: KVBackend, orderId: string, nowSeconds: number): Promise<ConsumeResult> {
  const order = await getOrder(b, orderId);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.expiresAt <= nowSeconds) return { ok: false, reason: "expired" };
  if (order.downloadsRemaining <= 0) return { ok: false, reason: "exhausted" };
  const updated = { ...order, downloadsRemaining: order.downloadsRemaining - 1 };
  await putOrder(b, updated);
  return { ok: true, remaining: updated.downloadsRemaining };
}

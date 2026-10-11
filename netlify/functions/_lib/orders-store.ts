import { getStore } from "@netlify/blobs";

/**
 * Where orders live, as the order lifecycle (`order.ts`) sees it. Two
 * implementations: `kvOrderStore` over a key/value backend (Netlify Blobs in
 * prod, in-memory in tests) and `supabaseOrderStore` over Postgres
 * (`supabase-orders.ts`). Both must give the same answers, including the
 * atomicity of `consumeDownload` and `extendDeadline` under parallel calls.
 */
export interface OrderStore {
  get(orderId: string): Promise<OrderRecord | null>;
  /** Inserts or fully overwrites the order. */
  put(order: OrderRecord): Promise<void>;
  consumeDownload(orderId: string, nowSeconds: number): Promise<ConsumeResult>;
  extendDeadline(orderId: string, nowSeconds: number, ttlSeconds: number): Promise<ExtendResult>;
}

export function kvOrderStore(b: KVBackend): OrderStore {
  return {
    get: (orderId) => getOrder(b, orderId),
    put: (order) => putOrder(b, order),
    consumeDownload: (orderId, now) => consumeDownload(b, orderId, now),
    extendDeadline: (orderId, now, ttl) => extendDeadline(b, orderId, now, ttl),
  };
}

/**
 * Key/value backend abstraction. Functions in this module take a backend so
 * tests can swap a real Netlify Blobs store for an in-memory fake. Production
 * uses `netlifyBlobsBackend()`.
 */
export interface KVBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  /** Like `get`, plus an opaque version token that changes on every write. */
  getVersioned(key: string): Promise<VersionedValue | null>;
  /**
   * Compare-and-set. Writes only if the stored version still equals `expected`
   * (or, with `expected: null`, only if the key does not exist yet). Returns
   * `false` when another writer got there first, so the caller can re-read and
   * retry.
   */
  setIf(key: string, value: string, expected: string | null): Promise<boolean>;
}

export interface VersionedValue {
  value: string;
  version: string;
}

export function netlifyBlobsBackend(): KVBackend {
  // Strong consistency: the compare-and-set loops below must read the latest
  // write, not an eventually-consistent copy, or they would retry on stale data.
  const store = getStore({ name: "orders", consistency: "strong" });
  return {
    get: async (key) => (await store.get(key, { type: "text" })) ?? null,
    set: async (key, value) => {
      await store.set(key, value);
    },
    getVersioned: async (key) => {
      const entry = await store.getWithMetadata(key, { type: "text" });
      if (!entry) return null;
      if (!entry.etag) throw new Error(`Netlify Blobs returned no etag for "${key}"`);
      return { value: entry.data, version: entry.etag };
    },
    setIf: async (key, value, expected) => {
      const res = await store.set(
        key,
        value,
        expected === null ? { onlyIfNew: true } : { onlyIfMatch: expected },
      );
      return res.modified;
    },
  };
}

/** In-memory backend for tests + local dev when Blobs context isn't wired up. */
export function inMemoryBackend(seed: Record<string, string> = {}): KVBackend {
  const map = new Map<string, VersionedValue>();
  let counter = 0;
  const write = (k: string, v: string) => map.set(k, { value: v, version: String(++counter) });
  for (const [k, v] of Object.entries(seed)) write(k, v);
  return {
    get: async (k) => map.get(k)?.value ?? null,
    set: async (k, v) => {
      write(k, v);
    },
    getVersioned: async (k) => {
      const entry = map.get(k);
      return entry ? { ...entry } : null;
    },
    setIf: async (k, v, expected) => {
      if ((map.get(k)?.version ?? null) !== expected) return false;
      write(k, v);
      return true;
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
  return raw ? parseOrder(raw) : null;
}

function parseOrder(raw: string): OrderRecord | null {
  try {
    return JSON.parse(raw) as OrderRecord;
  } catch {
    return null;
  }
}

/**
 * The one rule for "is this order past its deadline". It matches how the JWT
 * `exp` is checked (a token is dead at `exp`, not one second after), so a link
 * is never accepted by one path and refused by another at the same instant.
 */
export function isExpired(order: OrderRecord, nowSeconds: number): boolean {
  return order.expiresAt <= nowSeconds;
}

export function isExhausted(order: OrderRecord): boolean {
  return order.downloadsRemaining <= 0;
}

const MAX_CAS_ATTEMPTS = 8;

type Decision<E> = { next: OrderRecord } | { reject: E };

type UpdateResult<E> =
  | { ok: true; order: OrderRecord }
  | { ok: false; reason: E | "not_found" | "conflict" };

/**
 * Read-decide-write with compare-and-set: `decide` sees the current record and
 * either proposes the next one or rejects. If another writer changed the order
 * between our read and write, the write is refused and we start over from the
 * fresh record, so no update is ever lost. Gives up with `conflict` only after
 * repeated contention.
 */
async function updateOrder<E>(
  b: KVBackend,
  orderId: string,
  decide: (current: OrderRecord) => Decision<E>,
): Promise<UpdateResult<E>> {
  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
    const entry = await b.getVersioned(orderId);
    if (!entry) return { ok: false, reason: "not_found" };
    const current = parseOrder(entry.value);
    if (!current) return { ok: false, reason: "not_found" };

    const decision = decide(current);
    if ("reject" in decision) return { ok: false, reason: decision.reject };

    if (await b.setIf(orderId, JSON.stringify(decision.next), entry.version)) {
      return { ok: true, order: decision.next };
    }
  }
  return { ok: false, reason: "conflict" };
}

export type ConsumeResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: "not_found" | "exhausted" | "expired" | "conflict" };

/**
 * Spend one download from the allowance. Atomic: N parallel calls on an order
 * with K downloads left grant exactly min(N, K) of them.
 */
export async function consumeDownload(
  b: KVBackend,
  orderId: string,
  nowSeconds: number,
): Promise<ConsumeResult> {
  const result = await updateOrder<"expired" | "exhausted">(b, orderId, (order) => {
    if (isExpired(order, nowSeconds)) return { reject: "expired" };
    if (isExhausted(order)) return { reject: "exhausted" };
    return { next: { ...order, downloadsRemaining: order.downloadsRemaining - 1 } };
  });
  if (!result.ok) return result;
  return { ok: true, remaining: result.order.downloadsRemaining };
}

export type ExtendResult =
  | { ok: true; order: OrderRecord }
  | { ok: false; reason: "not_found" | "exhausted" | "expired" | "conflict" };

/**
 * Push the deadline out to at least `nowSeconds + ttlSeconds`, never pulling it
 * in (ADR-0001). Everything else on the order, `downloadsRemaining` included,
 * is kept as it is *now* in the store, so a download consumed a moment ago is
 * not overwritten.
 */
export async function extendDeadline(
  b: KVBackend,
  orderId: string,
  nowSeconds: number,
  ttlSeconds: number,
): Promise<ExtendResult> {
  return updateOrder<"expired" | "exhausted">(b, orderId, (order) => {
    if (isExpired(order, nowSeconds)) return { reject: "expired" };
    if (isExhausted(order)) return { reject: "exhausted" };
    return { next: { ...order, expiresAt: Math.max(nowSeconds + ttlSeconds, order.expiresAt) } };
  });
}

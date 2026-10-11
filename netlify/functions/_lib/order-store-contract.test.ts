// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { inMemoryBackend, kvOrderStore, type OrderRecord, type OrderStore } from "./orders-store";
import { supabaseOrderStore } from "./supabase-orders";

/**
 * The same behaviour checked against both order stores: the key/value one
 * (Netlify Blobs in prod) and the Supabase one, whose logic lives in the SQL
 * migration. The Supabase store runs against a real Postgres (PGlite, in
 * process) behind a fake of the PostgREST RPC endpoint.
 */

const MIGRATION = new URL(
  "../../../supabase/migrations/20261011000000_orders.sql",
  import.meta.url,
);
const NOW = 1_700_000_000;
const DAY = 60 * 60 * 24;

const order = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  orderId: "ord_1",
  packSlug: "dessau",
  email: "buyer@example.com",
  downloadsRemaining: 5,
  expiresAt: NOW + 30 * DAY,
  createdAt: NOW,
  ...overrides,
});

let db: PGlite;

beforeAll(async () => {
  db = await PGlite.create();
  // Roles Supabase provides; the secret key acts as `service_role`, which bypasses RLS.
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec(readFileSync(MIGRATION, "utf8"));
});

afterAll(async () => {
  await db.close();
});

/** Answers `POST /rest/v1/rpc/<fn>` like PostgREST, as the role the key maps to. */
function postgrestFake(): typeof fetch {
  return async (input, init) => {
    const url = new URL(String(input));
    const fn = url.pathname.replace("/rest/v1/rpc/", "");
    const headers = new Headers(init?.headers);
    if (headers.get("apikey") !== "sb_secret_test") return new Response("no key", { status: 401 });

    const args = Object.entries(JSON.parse(String(init?.body)) as Record<string, unknown>);
    const named = args.map(([k], i) => `${k} => $${i + 1}`).join(", ");
    try {
      await db.exec("set role service_role");
      const res = await db.query<{ r: unknown }>(
        `select public.${fn}(${named}) as r`,
        args.map(([, v]) => v),
      );
      const r = res.rows[0]?.r;
      return r === undefined || r === null || r === ""
        ? new Response(null, { status: 204 })
        : new Response(JSON.stringify(r), { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ message: String(err) }), { status: 400 });
    } finally {
      await db.exec("reset role");
    }
  };
}

const stores: Array<[string, () => Promise<OrderStore>]> = [
  ["kv (Netlify Blobs)", async () => kvOrderStore(inMemoryBackend())],
  [
    "Supabase (SQL migration)",
    async () => {
      await db.exec("truncate public.orders");
      return supabaseOrderStore(
        { url: "https://project.supabase.co", secretKey: "sb_secret_test" },
        postgrestFake(),
      );
    },
  ],
];

describe.each(stores)("order store contract: %s", (_name, make) => {
  let store: OrderStore;
  beforeEach(async () => {
    store = await make();
  });

  it("round-trips an order and returns null for an unknown one", async () => {
    await store.put(order());
    expect(await store.get("ord_1")).toEqual(order());
    expect(await store.get("ord_missing")).toBeNull();
  });

  it("put overwrites the whole order (a re-delivered webhook resets it)", async () => {
    await store.put(order({ downloadsRemaining: 1 }));
    await store.put(order({ email: "new@example.com", createdAt: NOW + 10 }));
    expect(await store.get("ord_1")).toEqual(
      order({ email: "new@example.com", createdAt: NOW + 10 }),
    );
  });

  it("consumeDownload spends one download at a time until exhausted", async () => {
    await store.put(order({ downloadsRemaining: 2 }));
    expect(await store.consumeDownload("ord_1", NOW)).toEqual({ ok: true, remaining: 1 });
    expect(await store.consumeDownload("ord_1", NOW)).toEqual({ ok: true, remaining: 0 });
    expect(await store.consumeDownload("ord_1", NOW)).toEqual({ ok: false, reason: "exhausted" });
    expect((await store.get("ord_1"))?.downloadsRemaining).toBe(0);
  });

  it("parallel downloads never grant more than the allowance", async () => {
    await store.put(order({ downloadsRemaining: 3 }));
    const results = await Promise.all(
      Array.from({ length: 10 }, () => store.consumeDownload("ord_1", NOW)),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect((await store.get("ord_1"))?.downloadsRemaining).toBe(0);
  });

  it("an order is dead at expiresAt, alive one second before", async () => {
    await store.put(order({ expiresAt: NOW + 1 }));
    expect(await store.consumeDownload("ord_1", NOW)).toMatchObject({ ok: true });
    expect(await store.consumeDownload("ord_1", NOW + 1)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("consumeDownload on an unknown order is not_found", async () => {
    expect(await store.consumeDownload("ord_missing", NOW)).toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("extendDeadline pushes the deadline out and keeps the allowance", async () => {
    await store.put(order({ downloadsRemaining: 3, expiresAt: NOW + DAY }));
    const result = await store.extendDeadline("ord_1", NOW, 7 * DAY);
    expect(result).toEqual({
      ok: true,
      order: order({ downloadsRemaining: 3, expiresAt: NOW + 7 * DAY }),
    });
    expect(await store.get("ord_1")).toEqual(
      order({ downloadsRemaining: 3, expiresAt: NOW + 7 * DAY }),
    );
  });

  it("extendDeadline never shortens a longer deadline", async () => {
    await store.put(order({ expiresAt: NOW + 30 * DAY }));
    const result = await store.extendDeadline("ord_1", NOW, 7 * DAY);
    expect(result).toMatchObject({ ok: true, order: { expiresAt: NOW + 30 * DAY } });
  });

  it("extendDeadline refuses expired, exhausted and unknown orders", async () => {
    await store.put(order({ orderId: "dead", expiresAt: NOW }));
    await store.put(order({ orderId: "spent", downloadsRemaining: 0 }));
    expect(await store.extendDeadline("dead", NOW, DAY)).toEqual({ ok: false, reason: "expired" });
    expect(await store.extendDeadline("spent", NOW, DAY)).toEqual({
      ok: false,
      reason: "exhausted",
    });
    expect(await store.extendDeadline("nope", NOW, DAY)).toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});

describe("Supabase permissions", () => {
  it("the browser keys can neither read the table nor call the functions", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      try {
        await expect(db.query("select * from public.orders")).rejects.toThrow(/permission denied/);
        await expect(db.query("select public.get_order('ord_1')")).rejects.toThrow(
          /permission denied/,
        );
        await expect(db.query("select public.consume_download('ord_1', 0)")).rejects.toThrow(
          /permission denied/,
        );
      } finally {
        await db.exec("reset role");
      }
    }
  });
});

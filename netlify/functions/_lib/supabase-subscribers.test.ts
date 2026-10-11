// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { supabaseSubscriberStore } from "./supabase-subscribers";

const MIGRATION = new URL(
  "../../../supabase/migrations/20261011080000_subscribers.sql",
  import.meta.url,
);

describe("supabaseSubscriberStore transport", () => {
  it("calls subscribe_email with the secret key in the apikey header only", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    await supabaseSubscriberStore(
      { url: "https://abcd.supabase.co/", secretKey: "sb_secret_xyz" },
      fetchImpl,
    ).subscribe({ email: "a@b.co", source: "studio", consentText: "text" });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://abcd.supabase.co/rest/v1/rpc/subscribe_email");
    expect(JSON.parse(String(init?.body))).toEqual({
      p_email: "a@b.co",
      p_source: "studio",
      p_consent_text: "text",
    });
    const headers = new Headers(init?.headers);
    expect(headers.get("apikey")).toBe("sb_secret_xyz");
    expect(headers.has("authorization")).toBe(false);
  });

  it("throws without the response body (it can echo the address) or the key", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"message":"a@b.co is bad"}', { status: 500 }),
    );
    const err = await supabaseSubscriberStore(
      { url: "https://abcd.supabase.co", secretKey: "sb_secret_xyz" },
      fetchImpl,
    )
      .subscribe({ email: "a@b.co", source: "studio", consentText: "t" })
      .catch((e: Error) => e);
    expect((err as Error).message).toBe("Supabase rpc subscribe_email failed: 500");
  });
});

describe("subscribers migration (PGlite)", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    await db.exec(readFileSync(MIGRATION, "utf8"));
  });
  afterAll(async () => {
    await db.close();
  });

  const sub = async (email: string, source = "studio", consent = "c") => {
    await db.exec("set role service_role");
    await db.query("select public.subscribe_email($1, $2, $3)", [email, source, consent]);
    await db.exec("reset role");
  };
  const rows = async () =>
    (
      await db.query<{ email: string; source: string; unsubscribed_at: string | null }>(
        "select email, source, unsubscribed_at from public.subscribers order by id",
      )
    ).rows;

  it("stores one row per address whatever the capitalisation, keeping the first", async () => {
    await sub(" Ana@Example.com ", "studio");
    await sub("ana@example.com", "footer");
    expect(await rows()).toEqual([
      { email: "Ana@Example.com", source: "studio", unsubscribed_at: null },
    ]);
  });

  it("subscribes again someone who had unsubscribed", async () => {
    await sub("bob@example.com", "footer");
    await db.query("update public.subscribers set unsubscribed_at = now() where email = $1", [
      "bob@example.com",
    ]);
    await sub("bob@example.com", "studio");
    const bob = (await rows()).find((r) => r.email === "bob@example.com");
    expect(bob).toEqual({ email: "bob@example.com", source: "studio", unsubscribed_at: null });
  });

  it("gives the browser roles no access to the table or the function", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(db.query("select * from public.subscribers")).rejects.toThrow(
        /permission denied/,
      );
      await expect(db.query("select public.subscribe_email('x@y.co','web','c')")).rejects.toThrow(
        /permission denied/,
      );
      await db.exec("reset role");
    }
  });
});

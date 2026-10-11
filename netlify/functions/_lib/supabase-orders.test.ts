// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { supabaseOrderStore } from "./supabase-orders";

function recordingFetch(response: Response) {
  return vi.fn<typeof fetch>(async () => response);
}

describe("supabaseOrderStore transport", () => {
  it("calls the RPC endpoint with the secret key in the apikey header only", async () => {
    const fetchImpl = recordingFetch(new Response(null, { status: 204 }));
    const store = supabaseOrderStore(
      { url: "https://abcd.supabase.co/", secretKey: "sb_secret_xyz" },
      fetchImpl,
    );

    await expect(store.get("ord_1")).resolves.toBeNull();

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://abcd.supabase.co/rest/v1/rpc/get_order");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ p_order_id: "ord_1" }));
    const headers = new Headers(init?.headers);
    expect(headers.get("apikey")).toBe("sb_secret_xyz");
    // New keys are not JWTs: sending one as a bearer token gets it rejected.
    expect(headers.has("authorization")).toBe(false);
  });

  it("also sends a legacy service_role JWT as a bearer token", async () => {
    const fetchImpl = recordingFetch(new Response(null, { status: 204 }));
    const store = supabaseOrderStore(
      { url: "https://abcd.supabase.co", secretKey: "eyJhbGciOi.legacy.jwt" },
      fetchImpl,
    );
    await store.get("ord_1");
    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer eyJhbGciOi.legacy.jwt");
  });

  it("throws on a non-2xx answer without putting the key in the message", async () => {
    const fetchImpl = recordingFetch(new Response('{"message":"boom"}', { status: 500 }));
    const store = supabaseOrderStore(
      { url: "https://abcd.supabase.co", secretKey: "sb_secret_xyz" },
      fetchImpl,
    );
    const err = await store.consumeDownload("ord_1", 1).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain("consume_download failed: 500");
    expect((err as Error).message).not.toContain("sb_secret_xyz");
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { submitRecoverRequest } from "./recover";

describe("submitRecoverRequest", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("posts trimmed email + orderId to the default endpoint and returns ok on 200", async () => {
    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));
    const out = await submitRecoverRequest({ email: "  buyer@example.com  ", orderId: " 12345 " });
    expect(out).toEqual({ kind: "ok" });
    expect(fetchSpy).toHaveBeenCalledWith(
      "/.netlify/functions/recover-link",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "buyer@example.com", orderId: "12345" }),
      }),
    );
  });

  it("uses the body.error when the server returns a 4xx with JSON", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400 }),
    );
    const out = await submitRecoverRequest({ email: "x@y.z", orderId: "abc" });
    expect(out).toEqual({ kind: "error", message: "Bad JSON", status: 400 });
  });

  it("falls back to a generic 'Server returned N' when the error body has no JSON", async () => {
    fetchSpy.mockResolvedValue(new Response("plain text", { status: 502 }));
    const out = await submitRecoverRequest({ email: "x@y.z", orderId: "abc" });
    expect(out).toEqual({ kind: "error", message: "Server returned 502", status: 502 });
  });

  it("captures network failures as a structured error", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));
    const out = await submitRecoverRequest({ email: "x@y.z", orderId: "abc" });
    expect(out).toEqual({ kind: "error", message: "Failed to fetch" });
  });

  it("forwards an AbortSignal so callers can cancel in-flight requests", async () => {
    const controller = new AbortController();
    fetchSpy.mockImplementation(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    const promise = submitRecoverRequest(
      { email: "x@y.z", orderId: "abc" },
      { signal: controller.signal },
    );
    controller.abort();
    const out = await promise;
    expect(out.kind).toBe("error");
  });

  it("honours the endpoint override (used by tests / staging environments)", async () => {
    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));
    await submitRecoverRequest(
      { email: "x@y.z", orderId: "abc" },
      { endpoint: "https://staging.example/recover" },
    );
    expect(fetchSpy).toHaveBeenCalledWith("https://staging.example/recover", expect.any(Object));
  });
});

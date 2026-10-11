// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createLoopsFormClient } from "./loops-form";

const reply = (status: number, body: unknown = { success: true }) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("Loops form client", () => {
  it("posts the email and source form-encoded to the form endpoint", async () => {
    const fetchImpl = reply(200);
    const out = await createLoopsFormClient("form_1", fetchImpl).subscribe({
      email: "a+b@example.com",
      source: "studio",
    });
    expect(out).toBe("ok");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://app.loops.so/api/newsletter-form/form_1");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/x-www-form-urlencoded",
    );
    expect(init.body).toBe("email=a%2Bb%40example.com&source=studio");
  });

  it("maps 429 and 400 to results the handler can answer", async () => {
    const client = (status: number) =>
      createLoopsFormClient("f", reply(status, { success: false, message: "x" }));
    expect(await client(429).subscribe({ email: "a@b.co", source: "web" })).toBe("rate_limited");
    expect(await client(400).subscribe({ email: "a@b.co", source: "web" })).toBe("invalid_email");
  });

  it("throws on a server error or success:false", async () => {
    await expect(
      createLoopsFormClient("f", reply(500)).subscribe({ email: "a@b.co", source: "web" }),
    ).rejects.toThrow(/500/);
    await expect(
      createLoopsFormClient("f", reply(200, { success: false })).subscribe({
        email: "a@b.co",
        source: "web",
      }),
    ).rejects.toThrow(/success:false/);
  });
});

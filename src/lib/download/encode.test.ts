import { describe, it, expect, vi } from "vitest";
import { encodeWithFallback, type EncodeFormat } from "./encode";

type ToBlobCallback = (blob: Blob | null) => void;
type ToBlobStub = (cb: ToBlobCallback, type?: string, quality?: number) => void;

/**
 * Minimal canvas stub for encode tests. `toBlobImpl` controls what the stub
 * returns for each (type, quality) pair.
 */
function makeCanvasStub(toBlobImpl: ToBlobStub): HTMLCanvasElement {
  return { toBlob: toBlobImpl } as unknown as HTMLCanvasElement;
}

describe("encodeWithFallback", () => {
  it("returns the first format whose blob matches the requested type", async () => {
    const canvas = makeCanvasStub((cb, type) => {
      cb(new Blob(["x"], { type: type ?? "" }));
    });
    const formats: EncodeFormat[] = [
      { type: "image/webp", quality: 0.95 },
      { type: "image/jpeg", quality: 0.95 },
    ];
    const out = await encodeWithFallback(canvas, formats);
    expect(out.blob.type).toBe("image/webp");
    expect(out.ext).toBe("webp");
  });

  it("falls back to the next format when WebP toBlob yields PNG instead", async () => {
    // Simulates Safari < 14: toBlob("image/webp") returns PNG data silently.
    const toBlobSpy = vi.fn<ToBlobStub>((cb, type) => {
      if (type === "image/webp") cb(new Blob(["x"], { type: "image/png" }));
      else cb(new Blob(["y"], { type: type ?? "" }));
    });
    const canvas = makeCanvasStub(toBlobSpy);
    const out = await encodeWithFallback(canvas, [
      { type: "image/webp", quality: 0.95 },
      { type: "image/jpeg", quality: 0.95 },
    ]);
    expect(out.blob.type).toBe("image/jpeg");
    expect(out.ext).toBe("jpg");
    expect(toBlobSpy).toHaveBeenCalledTimes(2);
  });

  it("falls back when toBlob returns null", async () => {
    const canvas = makeCanvasStub((cb, type) => {
      if (type === "image/webp") cb(null);
      else cb(new Blob(["y"], { type: type ?? "" }));
    });
    const out = await encodeWithFallback(canvas, [
      { type: "image/webp", quality: 0.95 },
      { type: "image/jpeg", quality: 0.95 },
    ]);
    expect(out.ext).toBe("jpg");
  });

  it("respects format order (tries webp before jpeg)", async () => {
    const calls: string[] = [];
    const canvas = makeCanvasStub((cb, type) => {
      calls.push(type ?? "unknown");
      // Always fail until jpeg
      if (type === "image/jpeg") cb(new Blob(["y"], { type }));
      else cb(null);
    });
    await encodeWithFallback(canvas, [
      { type: "image/webp", quality: 0.95 },
      { type: "image/jpeg", quality: 0.95 },
    ]);
    expect(calls).toEqual(["image/webp", "image/jpeg"]);
  });

  it("rejects when no format in the list produces a matching blob", async () => {
    const canvas = makeCanvasStub((cb) => cb(null));
    await expect(
      encodeWithFallback(canvas, [
        { type: "image/webp", quality: 0.95 },
        { type: "image/jpeg", quality: 0.95 },
      ]),
    ).rejects.toThrow("no format produced");
  });

  it("passes quality to toBlob", async () => {
    const toBlobSpy = vi.fn<ToBlobStub>((cb, type, quality) => {
      cb(new Blob(["x"], { type: type ?? "" }));
      void quality;
    });
    await encodeWithFallback(makeCanvasStub(toBlobSpy), [{ type: "image/webp", quality: 0.87 }]);
    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.87);
  });
});

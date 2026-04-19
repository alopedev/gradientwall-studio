// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { downloadWallpaper } from "./index";
import type { Colors4 } from "../palettes";

// The facade is a thin orchestration — we verify it calls the sink with a
// correctly-formatted filename and passes the encoded blob through.
describe("downloadWallpaper (facade)", () => {
  it("invokes the custom sink with the filename gradientwall-{device}-{seedHex}.{ext}", async () => {
    const sinkCalls: { blob: Blob; filename: string }[] = [];
    const sink = vi.fn(async (blob: Blob, filename: string) => {
      sinkCalls.push({ blob, filename });
    });

    // Stub document.createElement + canvas.toBlob so the pipeline completes.
    const toBlob = vi.fn((cb: (b: Blob | null) => void, type?: string) => {
      cb(new Blob(["x"], { type: type ?? "" }));
    });
    vi.spyOn(document, "createElement").mockReturnValue({
      width: 0,
      height: 0,
      getContext: vi.fn(() => null), // renderGradient early-returns, but that's fine — we want to test the facade wiring, not the render
      toBlob,
    } as unknown as HTMLElement);

    const colors: Colors4 = ["#000000", "#111111", "#222222", "#333333"];
    await downloadWallpaper(
      { device: "mobile", colors, style: "mesh", blur: 48, grain: 45, seed: 0xa47b },
      sink,
    );

    expect(sink).toHaveBeenCalledOnce();
    expect(sinkCalls[0].filename).toBe("gradientwall-mobile-#A47B.webp");
    expect(sinkCalls[0].blob.type).toBe("image/webp");

    vi.restoreAllMocks();
  });
});

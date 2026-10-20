// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { exportCanvas, exportFormat } from "./export";

/** A canvas whose `toBlob` answers with the given MIME types, in order of request. */
function fakeCanvas(encodes: readonly string[] = ["image/webp"]): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.toBlob = ((cb: BlobCallback, type?: string) => {
    cb(encodes.includes(type ?? "") ? new Blob(["px"], { type }) : null);
  }) as HTMLCanvasElement["toBlob"];
  return canvas;
}

describe("exportCanvas", () => {
  it("renders, encodes and hands the file to the sink under the wallpaper's name", async () => {
    const sink = vi.fn(async () => undefined);
    const result = await exportCanvas(() => fakeCanvas(), { device: "mobile", seed: 0xa47b, sink });

    expect(result).toEqual({ filename: "gradientwall-mobile-A47B.webp", bytes: 2 });
    expect(sink).toHaveBeenCalledWith(expect.any(Blob), "gradientwall-mobile-A47B.webp");
  });

  it("falls back to JPEG when the browser has no WebP encoder", async () => {
    const sink = vi.fn(async () => undefined);
    const result = await exportCanvas(() => fakeCanvas(["image/jpeg"]), {
      device: "desktop",
      seed: 1,
      sink,
    });
    expect(result?.filename).toBe("gradientwall-desktop-0001.jpg");
  });

  it("reports progress by stage, rising to 1", async () => {
    const progress: number[] = [];
    await exportCanvas(() => fakeCanvas(), {
      device: "mobile",
      seed: 1,
      sink: async () => undefined,
      onProgress: (p) => progress.push(p),
    });
    expect(progress).toEqual([0.05, 0.65, 0.95, 1]);
  });

  it("answers null without saving when the renderer can't draw, so the caller can fall back", async () => {
    const sink = vi.fn(async () => undefined);
    const progress: number[] = [];
    const result = await exportCanvas(() => null, {
      device: "mobile",
      seed: 1,
      sink,
      onProgress: (p) => progress.push(p),
    });
    expect(result).toBeNull();
    expect(sink).not.toHaveBeenCalled();
    expect(progress).toEqual([0.05]);
  });

  it("renders after the first progress step has had a frame to paint", async () => {
    const order: string[] = [];
    await exportCanvas(
      () => {
        order.push("render");
        return fakeCanvas();
      },
      {
        device: "mobile",
        seed: 1,
        sink: async () => undefined,
        onProgress: (p) => order.push(String(p)),
      },
    );
    expect(order.slice(0, 2)).toEqual(["0.05", "render"]);
  });
});

describe("exportFormat", () => {
  it("names the format the file will have", () => {
    const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL");
    toDataURL.mockImplementation(((type?: string) => `data:${type};base64,AA`) as never);
    expect(exportFormat()).toBe("WebP");
    toDataURL.mockImplementation((() => "data:image/png;base64,AA") as never);
    expect(exportFormat()).toBe("JPEG");
    toDataURL.mockRestore();
  });
});

// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

const composeWallpaper = vi.fn((_opts: unknown) => document.createElement("canvas"));
vi.mock("./compose", () => ({ composeWallpaper: (o: unknown) => composeWallpaper(o) }));

import { downloadWallpaper } from "./index";

describe("downloadWallpaper — params", () => {
  it("forwards density, contrast and vibrance so the download matches the preview", async () => {
    await downloadWallpaper(
      {
        device: "desktop",
        colors: ["#000000", "#111111", "#222222", "#333333"],
        style: "liquid",
        blur: 48,
        grain: 30,
        seed: 1,
        lightAngle: 90,
        density: 0.7,
        contrast: 1.3,
        vibrance: 0.8,
      },
      vi.fn(async () => undefined),
    );
    expect(composeWallpaper).toHaveBeenCalledWith(
      expect.objectContaining({
        w: 5120,
        h: 2880,
        density: 0.7,
        contrast: 1.3,
        vibrance: 0.8,
        lightAngle: 90,
      }),
    );
    expect(composeWallpaper.mock.calls[0]![0]).not.toHaveProperty("device");
  });
});

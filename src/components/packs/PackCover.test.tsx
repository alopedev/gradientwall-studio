import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EngineProvider, webglEngine } from "../studio/engine";
import { PackCover } from "./PackCover";

describe("PackCover", () => {
  it("paints a gradient cover through the wallpaper engine, like the Studio's thumbnails", () => {
    const paintThumbnail = vi.fn();
    const cover = {
      kind: "gradient" as const,
      colors: ["#101010", "#334455", "#aa5533", "#f0e0d0"] as [string, string, string, string],
      style: "mesh" as const,
      blur: 48,
      grain: 30,
      seed: 7,
    };
    const { container } = render(
      <EngineProvider engine={{ ...webglEngine, paintThumbnail }}>
        <PackCover cover={cover} w={400} h={300} />
      </EngineProvider>,
    );
    const canvas = container.querySelector("canvas");
    expect(paintThumbnail).toHaveBeenCalledWith(
      canvas,
      { colors: cover.colors, style: "mesh", blur: 48, grain: 30, seed: 7 },
      { w: 400, h: 300 },
    );
  });
});

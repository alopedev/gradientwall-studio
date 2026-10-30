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

  describe("a smaller frame on phones (phoneBox)", () => {
    const landscape = {
      kind: "image" as const,
      url: "/assets/packs/acrylic/01.jpg",
      alt: "Acrylic paint",
      width: 1600,
      height: 900,
    };
    const portrait = {
      kind: "image" as const,
      url: "/assets/packs/dessau/01_kreise.png",
      alt: "Bauhaus circles",
      width: 1170,
      height: 2080,
    };

    it("gives phones the light centre crop where the larger frame needs the full file", () => {
      const { container } = render(
        <PackCover cover={landscape} box={[224, 486]} phoneBox={[137, 310]} />,
      );
      const source = container.querySelector("picture > source");
      expect(source?.getAttribute("media")).toBe("(max-width: 767px)");
      expect(source?.getAttribute("srcset")).toBe("/assets/packs/acrylic/01-phone.webp");
      // Wider screens keep the full-size choice.
      expect(container.querySelector("picture > img")?.getAttribute("sizes")).toBe(
        "(max-width: 767px) 551px, 864px",
      );
    });

    it("tells the browser the phone frame is smaller, so it picks a smaller file", () => {
      const { container } = render(
        <PackCover cover={portrait} box={[224, 486]} phoneBox={[137, 310]} />,
      );
      expect(container.querySelector("picture")).toBeNull();
      expect(container.querySelector("img")?.getAttribute("sizes")).toBe(
        "(max-width: 767px) 174px, 273px",
      );
    });

    it("changes nothing without it", () => {
      const { container } = render(<PackCover cover={portrait} box={[224, 486]} />);
      expect(container.querySelector("img")?.getAttribute("sizes")).toBe("273px");
    });
  });
});

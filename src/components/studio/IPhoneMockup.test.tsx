import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IPhoneMockup } from "./IPhoneMockup";
import type { Colors4 } from "@/lib/palettes";

const COLORS: Colors4 = ["#111111", "#222222", "#333333", "#444444"];
const common = { colors: COLORS, style: "mesh", blur: 48, seed: 42, grain: 45 } as const;

describe("<IPhoneMockup />", () => {
  it("renders no lock-screen chrome (clock/date were dropped — they couldn't match the photographic tilt cleanly)", () => {
    render(<IPhoneMockup {...common} />);
    expect(screen.queryByText("9:41")).not.toBeInTheDocument();
    expect(screen.queryByText(/Monday/i)).not.toBeInTheDocument();
  });

  it("mounts a canvas (the wallpaper inside the device screen)", () => {
    const { container } = render(<IPhoneMockup {...common} />);
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("uses the photographic frame asset", () => {
    const { container } = render(<IPhoneMockup {...common} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain("/deviceMockups/iPhoneMockup.png");
  });

  it("the served PNG is RGBA — alpha channel acts as the screen mask", () => {
    // Pixel-perfect alignment relies on the screen pixels being alpha=0,
    // not solid black. Read the PNG header directly: byte 25 (0-indexed) is
    // the IHDR colour-type field, which must be 6 for RGBA. Replacing the
    // asset with a non-RGBA PNG silently breaks the masking strategy and
    // would only show as visual bleed; this test catches that fast.
    const pngPath = resolve(
      __dirname,
      "../../../public/assets/deviceMockups/iPhoneMockup.png",
    );
    const buf = readFileSync(pngPath);
    // PNG signature (8 bytes) + IHDR length (4) + "IHDR" (4) + width (4) + height (4) = 24
    // → byte 25 is bit-depth, byte 26 is colour-type.
    const colourType = buf[25];
    expect(colourType).toBe(6); // 6 = RGBA
  });

  it("renders the wallpaper BEHIND the photo with overscan (alpha-mask strategy)", () => {
    const { container } = render(<IPhoneMockup {...common} />);
    // The wallpaper container precedes the <img> in DOM order so it's the
    // back layer (later siblings paint on top).
    const root = container.querySelector("[style*='aspect-ratio: 1 / 1']")!;
    const children = Array.from(root.children);
    const wallpaperIdx = children.findIndex((c) => c.querySelector("canvas"));
    const imgIdx = children.findIndex((c) => c.tagName === "IMG");
    expect(wallpaperIdx).toBeGreaterThanOrEqual(0);
    expect(imgIdx).toBeGreaterThanOrEqual(0);
    expect(wallpaperIdx).toBeLessThan(imgIdx);
    // The wallpaper rect is overscanned past the detected screen — extends
    // outside the screen rect on each side so the alpha hole is fully
    // covered. We don't pin the exact %, only the inequality.
    const wallpaper = children[wallpaperIdx] as HTMLElement;
    const widthPct = parseFloat(wallpaper.style.width);
    expect(widthPct).toBeGreaterThan(28); // detected screen width ≈ 28.23%
  });

  it("re-renders the canvas when spec deps (colors/style/blur/seed) change, but not for grain-only updates", async () => {
    const gradientModule = await import("@/lib/gradient");
    const renderSpy = vi.spyOn(gradientModule, "renderGradient");
    const colorsA: Colors4 = ["#111111", "#222222", "#333333", "#444444"];
    const colorsB: Colors4 = ["#000000", "#ff0000", "#00ff00", "#0000ff"];

    const { rerender } = render(<IPhoneMockup colors={colorsA} style="mesh" blur={48} seed={1} grain={45} />);
    const afterMount = renderSpy.mock.calls.length;
    expect(afterMount).toBeGreaterThan(0);

    rerender(<IPhoneMockup colors={colorsB} style="mesh" blur={48} seed={1} grain={45} />);
    expect(renderSpy.mock.calls.length).toBeGreaterThan(afterMount);
    const afterColors = renderSpy.mock.calls.length;

    rerender(<IPhoneMockup colors={colorsB} style="aurora" blur={48} seed={1} grain={45} />);
    expect(renderSpy.mock.calls.length).toBeGreaterThan(afterColors);
    const afterStyle = renderSpy.mock.calls.length;

    // grain-only change → no canvas re-render (grain is a CSS overlay)
    rerender(<IPhoneMockup colors={colorsB} style="aurora" blur={48} seed={1} grain={99} />);
    expect(renderSpy.mock.calls.length).toBe(afterStyle);

    renderSpy.mockRestore();
  });
});

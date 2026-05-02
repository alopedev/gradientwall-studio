import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IPhoneMockup } from "./IPhoneMockup";
import type { Colors4 } from "@/lib/palettes";

const COLORS: Colors4 = ["#111111", "#222222", "#333333", "#444444"];
const common = { colors: COLORS, style: "mesh", blur: 48, seed: 42, grain: 45 } as const;

describe("<IPhoneMockup />", () => {
  it("renders the lock-screen chrome (clock + Monday date)", () => {
    render(<IPhoneMockup {...common} />);
    expect(screen.getByText("9:41")).toBeInTheDocument();
    expect(screen.getByText(/Monday/i)).toBeInTheDocument();
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

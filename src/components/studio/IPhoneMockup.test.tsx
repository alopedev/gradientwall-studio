import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IPhoneMockup } from "./IPhoneMockup";
import type { Colors4 } from "@/lib/palettes";

const COLORS: Colors4 = ["#111111", "#222222", "#333333", "#444444"];
const common = { colors: COLORS, style: "mesh", blur: 48, seed: 42, grain: 45 } as const;

describe("<IPhoneMockup />", () => {
  it("lock variant renders the big clock + date (9:41 shown twice: status bar + lock clock)", () => {
    render(<IPhoneMockup variant="lock" {...common} />);
    expect(screen.getAllByText("9:41")).toHaveLength(2);
    expect(screen.getByText(/Monday/i)).toBeInTheDocument();
  });

  it("home variant renders 20 app-icon placeholders and no big clock", () => {
    const { container } = render(<IPhoneMockup variant="home" {...common} />);
    // The big clock is absent; the small status bar one remains
    // (status bar shows 9:41 at the top — allow it, but require no "Monday" date on home)
    expect(screen.queryByText(/Monday/i)).not.toBeInTheDocument();
    // 20 placeholder "app" tiles
    const grid = container.querySelector(".grid-cols-4");
    expect(grid).not.toBeNull();
    expect(grid!.children).toHaveLength(20);
  });

  it("mounts a canvas (the wallpaper behind chrome)", () => {
    const { container } = render(<IPhoneMockup variant="lock" {...common} />);
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("re-renders the canvas when spec deps (colors/style/blur/seed) change, but not for grain-only updates", async () => {
    const gradientModule = await import("@/lib/gradient");
    const renderSpy = vi.spyOn(gradientModule, "renderGradient");
    // Stable reference across rerenders so we only vary one prop at a time
    const colorsA: Colors4 = ["#111111", "#222222", "#333333", "#444444"];
    const colorsB: Colors4 = ["#000000", "#ff0000", "#00ff00", "#0000ff"];

    const { rerender } = render(<IPhoneMockup variant="lock" colors={colorsA} style="mesh" blur={48} seed={1} grain={45} />);
    const afterMount = renderSpy.mock.calls.length;
    expect(afterMount).toBeGreaterThan(0);

    // colors change → effect fires
    rerender(<IPhoneMockup variant="lock" colors={colorsB} style="mesh" blur={48} seed={1} grain={45} />);
    expect(renderSpy.mock.calls.length).toBeGreaterThan(afterMount);
    const afterColors = renderSpy.mock.calls.length;

    // style change → effect fires
    rerender(<IPhoneMockup variant="lock" colors={colorsB} style="aurora" blur={48} seed={1} grain={45} />);
    expect(renderSpy.mock.calls.length).toBeGreaterThan(afterColors);
    const afterStyle = renderSpy.mock.calls.length;

    // grain-only change → effect should NOT fire (grain is a CSS overlay, not a canvas dep)
    rerender(<IPhoneMockup variant="lock" colors={colorsB} style="aurora" blur={48} seed={1} grain={99} />);
    expect(renderSpy.mock.calls.length).toBe(afterStyle);

    renderSpy.mockRestore();
  });
});

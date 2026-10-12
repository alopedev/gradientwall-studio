import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Colors4 } from "@/lib/palettes";
import { useConfigStore } from "@/store/useConfigStore";
import { BrandMark, Logo } from "./Logo";

const DUSK: Colors4 = ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"];

describe("<BrandMark />", () => {
  beforeEach(() => {
    act(() => useConfigStore.setState({ colors: DUSK }));
  });

  it("is an ink square with a round window", () => {
    const { container } = render(<BrandMark size={26} />);
    const svg = container.querySelector("svg[data-brand-mark]");
    expect(svg).toHaveAttribute("width", "26");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.querySelector("rect")).toHaveAttribute("fill", "var(--color-ink)");
    expect(svg?.querySelector("circle")).toHaveAttribute("r", "33.75");
  });

  it("shows the Studio palette through the window, in order", () => {
    const { container } = render(<BrandMark size={26} />);
    const circle = container.querySelector("circle");
    const id = circle?.getAttribute("fill")?.match(/^url\(#(.+)\)$/)?.[1];
    expect(id).toBeTruthy();
    const stops = [...container.querySelectorAll("stop")].map((s) => s.getAttribute("stop-color"));
    expect(container.querySelector("linearGradient")?.id).toBe(id);
    expect(stops).toEqual(DUSK);
  });

  it("follows the palette when it changes", () => {
    const { container } = render(<BrandMark size={26} />);
    const next: Colors4 = ["#0b3d2e", "#1f8a70", "#bedb39", "#fff275"];
    act(() => useConfigStore.setState({ colors: next }));
    const stops = [...container.querySelectorAll("stop")].map((s) => s.getAttribute("stop-color"));
    expect(stops).toEqual(next);
  });

  it("has a paper window when drawn in ink only", () => {
    const { container } = render(<BrandMark size={16} ink />);
    expect(container.querySelector("circle")).toHaveAttribute("fill", "var(--color-bg)");
    expect(container.querySelector("linearGradient")).toBeNull();
  });
});

describe("<Logo />", () => {
  it("sets the wordmark beside the mark, scaled to it", () => {
    const { container } = render(<Logo size={26} />);
    const word = container.querySelector("svg[data-wordmark]");
    expect(container.querySelector("svg[data-brand-mark]")).toBeInTheDocument();
    expect(word?.querySelector("path")?.getAttribute("d")?.length).toBeGreaterThan(100);
    // The wordmark spans ascender to descender: 0.764 of the mark, centred on it.
    expect(Number(word?.getAttribute("height"))).toBeCloseTo(26 * 0.764, 1);
  });
});

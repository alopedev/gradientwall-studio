import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PALETTES } from "@/lib/palettes";
import { PaletteSwatches } from "./PaletteSwatches";

describe("PaletteSwatches", () => {
  it("shows one dot per curated palette", () => {
    render(<PaletteSwatches />);
    expect(screen.getAllByRole("button", { name: /^Palette / })).toHaveLength(PALETTES.length);
  });

  // 12 dots at 32px don't fit a 375px phone: the row must shrink to its box,
  // or it widens the whole panel and the frame clips the last palettes.
  it("lets the dots share the row instead of overflowing it", () => {
    render(<PaletteSwatches />);
    for (const dot of screen.getAllByRole("button", { name: /^Palette / })) {
      expect(dot.className).toContain("min-w-0");
      expect(dot.className).toContain("flex-1");
      expect(dot.className).toContain("max-w-8");
      expect(dot.className).not.toMatch(/(^|\s)w-8(\s|$)/);
    }
  });
});

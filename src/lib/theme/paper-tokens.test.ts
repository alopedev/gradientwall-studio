// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../color";

/** Reads `--name: #hex;` from the `@theme` block of src/index.css. */
function token(name: string): string {
  const css = readFileSync(new URL("../../index.css", import.meta.url), "utf8");
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!m) throw new Error(`token --${name} not found in index.css`);
  return m[1];
}

describe("paper theme tokens (identity B, Dessau paper)", () => {
  it("ink reads as body text on both paper surfaces (WCAG AAA, 7:1)", () => {
    expect(contrastRatio(token("color-paper-ink"), token("color-paper"))).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(token("color-paper-ink"), token("color-paper-2"))).toBeGreaterThanOrEqual(
      7,
    );
  });

  it("secondary text passes WCAG AA (4.5:1) on both paper surfaces", () => {
    expect(contrastRatio(token("color-paper-sub"), token("color-paper"))).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrastRatio(token("color-paper-sub"), token("color-paper-2"))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("text on the ink button passes WCAG AAA", () => {
    expect(contrastRatio(token("color-paper"), token("color-paper-ink"))).toBeGreaterThanOrEqual(7);
  });
});

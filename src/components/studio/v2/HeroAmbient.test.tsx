// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Colors4 } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { HeroAmbient } from "./HeroAmbient";

const INITIAL = useConfigStore.getState();
const A: Colors4 = ["#112233", "#445566", "#778899", "#aabbcc"];
const B: Colors4 = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

describe("HeroAmbient", () => {
  beforeEach(() => {
    act(() => useConfigStore.setState(INITIAL, true));
  });

  it("is decorative: hidden from assistive tech and never catches the pointer", () => {
    const { container } = render(<HeroAmbient />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.className).toContain("pointer-events-none");
  });

  it("paints pools of the current palette, all four colors", () => {
    act(() => useConfigStore.getState().setColors(A));
    const { container } = render(<HeroAmbient />);
    const html = container.innerHTML.toLowerCase();
    // jsdom serialises colors as rgb(): compare the channels.
    for (const rgb of ["17, 34, 51", "68, 85, 102", "119, 136, 153"]) {
      expect(html).toContain(rgb);
    }
    // The fourth color is the base layer under the pools.
    expect(html).toContain("170, 187, 204");
  });

  it("takes the new palette after a Shuffle or a palette change", () => {
    act(() => useConfigStore.getState().setColors(A));
    const { container } = render(<HeroAmbient />);
    act(() => useConfigStore.getState().setColors(B));
    expect(container.innerHTML.toLowerCase()).toContain("255, 0, 0");
  });
});

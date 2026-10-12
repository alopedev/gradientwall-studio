// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useConfigStore } from "@/store";
import { BauhausMarks } from "./BauhausMarks";

const INITIAL = useConfigStore.getState();
const fill = (el: Element) => (el as HTMLElement).style.getPropertyValue("--mark");

describe("BauhausMarks", () => {
  beforeEach(() => act(() => useConfigStore.setState(INITIAL, true)));

  it("draws a circle, a square and a triangle, hidden from assistive tech", () => {
    const { container } = render(<BauhausMarks />);
    const root = container.querySelector("[data-bauhaus-marks]");
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    const shapes = [...(root?.children ?? [])].map((c) => c.getAttribute("data-shape"));
    expect(shapes).toEqual(["circle", "square", "triangle"]);
  });

  it("paints them with the three light colours of the current palette and follows it", () => {
    act(() => useConfigStore.getState().setColors(["#000000", "#111111", "#222222", "#333333"]));
    const { container } = render(<BauhausMarks />);
    const marks = container.querySelectorAll("[data-shape]");
    expect([...marks].map(fill)).toEqual(["#222222", "#111111", "#333333"]);

    act(() => useConfigStore.getState().setColors(["#000000", "#aaaaaa", "#bbbbbb", "#cccccc"]));
    expect([...container.querySelectorAll("[data-shape]")].map(fill)).toEqual([
      "#bbbbbb",
      "#aaaaaa",
      "#cccccc",
    ]);
  });
});

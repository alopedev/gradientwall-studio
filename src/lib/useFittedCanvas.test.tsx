import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type FittedCanvasSpec, useFittedCanvas } from "./useFittedCanvas";

function Probe({ spec, tick }: { spec: FittedCanvasSpec; tick: number }) {
  const ref = useFittedCanvas(spec, [tick]);
  return <canvas ref={ref} />;
}

const base = (over: Partial<FittedCanvasSpec> = {}): FittedCanvasSpec => ({
  nativeW: 1000,
  nativeH: 1000,
  contentKey: "a",
  paint: vi.fn(),
  ...over,
});

/** Give the canvas's parent a layout size (jsdom has none). */
function sizeParent(container: HTMLElement, w: number, h: number) {
  const parent = container.querySelector("canvas")?.parentElement as HTMLElement;
  Object.defineProperty(parent, "clientWidth", { value: w, configurable: true });
  Object.defineProperty(parent, "clientHeight", { value: h, configurable: true });
}

describe("useFittedCanvas", () => {
  it("does not paint while the container has no size", () => {
    const spec = base();
    render(<Probe spec={spec} tick={0} />);
    expect(spec.paint).not.toHaveBeenCalled();
  });

  it("paints once at the fitted size, then skips an unchanged key", async () => {
    const spec = base();
    const { container, rerender } = render(<Probe spec={spec} tick={0} />);
    sizeParent(container, 200, 200);
    rerender(<Probe spec={spec} tick={1} />);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(spec.paint).toHaveBeenCalledTimes(1);
    expect(spec.paint).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), { w: 200, h: 200 });

    rerender(<Probe spec={spec} tick={2} />);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(spec.paint).toHaveBeenCalledTimes(1);
  });

  it("repaints on a new key, calling beforePaint only after the first paint", async () => {
    const beforePaint = vi.fn();
    const first = base({ beforePaint });
    const { container, rerender } = render(<Probe spec={first} tick={0} />);
    sizeParent(container, 200, 200);
    rerender(<Probe spec={first} tick={1} />);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(first.paint).toHaveBeenCalledTimes(1);
    expect(beforePaint).not.toHaveBeenCalled();

    const second = base({ beforePaint, contentKey: "b" });
    rerender(<Probe spec={second} tick={2} />);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(second.paint).toHaveBeenCalledTimes(1);
    expect(beforePaint).toHaveBeenCalledTimes(1);
  });

  it("runs sync on every pass, painted or not", async () => {
    const sync = vi.fn();
    const spec = base({ sync });
    const { container, rerender } = render(<Probe spec={spec} tick={0} />);
    sizeParent(container, 200, 200);
    rerender(<Probe spec={spec} tick={1} />);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    rerender(<Probe spec={spec} tick={2} />);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(sync).toHaveBeenCalledTimes(2);
    expect(spec.paint).toHaveBeenCalledTimes(1);
  });
});

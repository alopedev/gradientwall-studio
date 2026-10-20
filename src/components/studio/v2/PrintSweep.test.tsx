// @vitest-environment jsdom
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emitPrint, onPrint } from "./print";
import { PrintSweep } from "./PrintSweep";

const sweep = () => document.querySelector("[data-part=print-sweep]");

function reducedMotion(on: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((q: string) => ({
      matches: on && q.includes("reduce"),
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("print bus", () => {
  it("delivers events to subscribers until they leave", () => {
    const seen: string[] = [];
    const off = onPrint((e) => seen.push(e));
    emitPrint("start");
    off();
    emitPrint("done");
    expect(seen).toEqual(["start"]);
  });
});

describe("PrintSweep", () => {
  it("covers the screen with paper while the download renders", () => {
    reducedMotion(false);
    render(<PrintSweep />);
    expect(sweep()).toBeNull();
    act(() => emitPrint("start"));
    expect(sweep()).not.toBeNull();
  });

  it("uncovers the wallpaper when the file is done", async () => {
    reducedMotion(false);
    render(<PrintSweep />);
    act(() => emitPrint("start"));
    act(() => emitPrint("done"));
    await waitFor(() => expect(sweep()).toBeNull());
  });

  it("goes away if the render fails", () => {
    reducedMotion(false);
    render(<PrintSweep />);
    act(() => emitPrint("start"));
    act(() => emitPrint("fail"));
    expect(sweep()).toBeNull();
  });

  it("stays out of the way with reduced motion: the button shows progress", () => {
    reducedMotion(true);
    render(<PrintSweep />);
    act(() => emitPrint("start"));
    expect(sweep()).toBeNull();
  });
});

import { describe, it, expect, afterEach, vi } from "vitest";
import { makeRafBatcher } from "./raf-batcher";

interface State {
  blur: number;
  grain: number;
  density: number;
}

/**
 * Manual rAF queue. Gives us a synchronous `tick()` so tests stay
 * deterministic without `await waitFor()` ceremony.
 */
function manualRaf() {
  const queue: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  });
  return {
    tick: () => {
      const drain = queue.splice(0);
      for (const cb of drain) cb(performance.now());
    },
    pending: () => queue.length,
  };
}

describe("makeRafBatcher", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("coalesces patches in the same frame, last-write-wins per key", () => {
    const raf = manualRaf();
    const set = vi.fn<(p: Partial<State>) => void>();
    const batch = makeRafBatcher<State>(set);

    batch({ blur: 1 });
    batch({ blur: 2, grain: 10 });
    batch({ blur: 3 });

    expect(set).not.toHaveBeenCalled();
    raf.tick();
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({ blur: 3, grain: 10 });
  });

  it("re-arms after flush so successive frames each flush their own batch", () => {
    const raf = manualRaf();
    const set = vi.fn<(p: Partial<State>) => void>();
    const batch = makeRafBatcher<State>(set);

    batch({ blur: 1 });
    raf.tick();
    batch({ grain: 9 });
    raf.tick();

    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenNthCalledWith(1, { blur: 1 });
    expect(set).toHaveBeenNthCalledWith(2, { grain: 9 });
  });

  it("falls back to synchronous set when requestAnimationFrame is undefined", () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    const set = vi.fn<(p: Partial<State>) => void>();
    const batch = makeRafBatcher<State>(set);

    batch({ blur: 7 });
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({ blur: 7 });
  });

  it("flush() drains the pending patch synchronously and stays idempotent", () => {
    const raf = manualRaf();
    const set = vi.fn<(p: Partial<State>) => void>();
    const batch = makeRafBatcher<State>(set);

    batch({ blur: 4 });
    batch.flush();
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({ blur: 4 });

    // The rAF callback was already scheduled — when it eventually fires,
    // it must not re-emit the same patch.
    raf.tick();
    expect(set).toHaveBeenCalledTimes(1);

    // Second flush with nothing pending is a no-op.
    batch.flush();
    expect(set).toHaveBeenCalledTimes(1);
  });

  it("cancel() discards the pending patch; subsequent patches batch normally", () => {
    const raf = manualRaf();
    const set = vi.fn<(p: Partial<State>) => void>();
    const batch = makeRafBatcher<State>(set);

    batch({ blur: 99 });
    batch.cancel();
    raf.tick();
    expect(set).not.toHaveBeenCalled();

    batch({ grain: 12 });
    raf.tick();
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({ grain: 12 });
  });

  it("two batchers maintain independent state", () => {
    const raf = manualRaf();
    const setA = vi.fn<(p: Partial<State>) => void>();
    const setB = vi.fn<(p: Partial<State>) => void>();
    const a = makeRafBatcher<State>(setA);
    const b = makeRafBatcher<State>(setB);

    a({ blur: 1 });
    b({ grain: 2 });
    raf.tick();

    expect(setA).toHaveBeenCalledWith({ blur: 1 });
    expect(setB).toHaveBeenCalledWith({ grain: 2 });
  });

  it("rejects patches whose keys aren't in the generic state shape (type-only check)", () => {
    const set = vi.fn<(p: Partial<State>) => void>();
    const batch = makeRafBatcher<State>(set);
    // @ts-expect-error key 'nonsense' is not in State
    batch({ nonsense: 1 });
  });
});

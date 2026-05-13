export type RafSetter<T extends object> = (patch: Partial<T>) => void;

export interface RafBatcher<T extends object> {
  (patch: Partial<T>): void;
  /** Drain any pending patch synchronously. Idempotent. */
  flush: () => void;
  /** Discard any pending patch without applying it. Idempotent. */
  cancel: () => void;
}

/**
 * rAF-coalesced setter. Slider/dial drags emit dozens of `onChange` events
 * per second; without batching, every event triggers a state update + a
 * downstream repaint. Coalescing collapses all patches arriving within a
 * frame into a single `set()` call so the consumer paints at most once per
 * rAF tick. Patches are merged shallow, last-write-wins per key.
 *
 * Falls back to synchronous `set()` when `requestAnimationFrame` is
 * unavailable (jsdom node-env tests, SSR) so no test setup is required —
 * the `hasRAF` capture happens at construction, so tests that need to
 * exercise a specific branch should `vi.stubGlobal("requestAnimationFrame", …)`
 * before calling `makeRafBatcher`.
 */
export function makeRafBatcher<T extends object>(set: RafSetter<T>): RafBatcher<T> {
  let pending: Partial<T> | null = null;
  let scheduled = false;
  const hasRAF = typeof requestAnimationFrame === "function";

  const flush = () => {
    scheduled = false;
    if (pending) {
      const p = pending;
      pending = null;
      set(p);
    }
  };

  const batcher = ((patch: Partial<T>) => {
    if (!hasRAF) {
      set(patch);
      return;
    }
    pending = pending ? { ...pending, ...patch } : { ...patch };
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  }) as RafBatcher<T>;

  batcher.flush = flush;
  batcher.cancel = () => {
    pending = null;
  };
  return batcher;
}

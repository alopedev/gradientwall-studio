import { describe, expect, it, vi } from "vitest";
import { isPlainClick, runPageTransition, type TransitionDoc } from "./page-transition";

const click = (over: Partial<Parameters<typeof isPlainClick>[0]> = {}) => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
  ...over,
});

describe("isPlainClick", () => {
  it("accepts a plain left click", () => {
    expect(isPlainClick(click())).toBe(true);
  });

  it.each([
    ["middle button", { button: 1 }],
    ["cmd", { metaKey: true }],
    ["ctrl", { ctrlKey: true }],
    ["shift", { shiftKey: true }],
    ["alt", { altKey: true }],
    ["already handled", { defaultPrevented: true }],
  ])("leaves %s to the browser", (_, over) => {
    expect(isPlainClick(click(over))).toBe(false);
  });
});

/** A document whose view transition runs the callback and records the names seen at each step. */
function fakeDoc() {
  const seen: string[][] = [];
  let finish: () => void = () => undefined;
  const doc: TransitionDoc = {
    startViewTransition: vi.fn((update: () => Promise<void> | void) => {
      const updated = Promise.resolve().then(update);
      const finished = updated.then(() => new Promise<void>((r) => (finish = r)));
      return { finished, updateCallbackDone: updated };
    }),
    querySelector: (sel: string) => document.querySelector(sel),
  };
  return { doc, seen, finish: () => finish() };
}

function el(attrs: Record<string, string> = {}): HTMLElement {
  const e = document.createElement("div");
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  document.body.append(e);
  return e;
}

describe("runPageTransition", () => {
  it("just updates when the browser has no view transitions", async () => {
    const update = vi.fn();
    await runPageTransition({
      doc: { querySelector: () => null },
      update,
      ready: () => true,
      shared: [],
    });
    expect(update).toHaveBeenCalledOnce();
  });

  it("names the source before the snapshot and the destination after the update", async () => {
    document.body.innerHTML = "";
    const source = el();
    const { doc, finish } = fakeDoc();
    let namedAtUpdate = "";
    const update = vi.fn(() => {
      namedAtUpdate = source.style.viewTransitionName;
      source.remove();
      el({ "data-dest": "phone" });
    });

    const done = runPageTransition({
      doc,
      update,
      ready: () => document.querySelector("[data-dest]") !== null,
      shared: [{ name: "pack-phone", source, dest: "[data-dest=phone]" }],
    });
    await vi.waitFor(() => expect(update).toHaveBeenCalled());
    expect(namedAtUpdate).toBe("pack-phone");
    const dest = document.querySelector<HTMLElement>("[data-dest=phone]")!;
    await vi.waitFor(() => expect(dest.style.viewTransitionName).toBe("pack-phone"));

    finish();
    await done;
    expect(dest.style.viewTransitionName).toBe("");
  });

  it("names nothing with reduced motion, so the pages only cross-fade", async () => {
    document.body.innerHTML = "";
    const source = el();
    const { doc, finish } = fakeDoc();
    let named = "unset";
    const done = runPageTransition({
      doc,
      update: () => {
        named = source.style.viewTransitionName;
      },
      ready: () => true,
      reducedMotion: true,
      shared: [{ name: "pack-phone", source, dest: "[data-dest=phone]" }],
    });
    await vi.waitFor(() => expect(named).toBe(""));
    expect(doc.startViewTransition).toHaveBeenCalledOnce();
    finish();
    await done;
  });

  it("stops waiting for the new page after the timeout", async () => {
    const { doc, finish } = fakeDoc();
    const done = runPageTransition({
      doc,
      update: () => undefined,
      ready: () => false,
      shared: [],
      timeoutMs: 20,
    });
    await new Promise((r) => setTimeout(r, 60));
    finish();
    await expect(done).resolves.toBeUndefined();
  });
});

/**
 * Route changes as View Transitions (A1, 2026-10-20): the browser snapshots
 * the old page, React renders the new one, and elements that carry the same
 * `view-transition-name` on both sides morph into each other. The catalog card
 * uses it so its front phone and name fly into the pack page.
 *
 * BrowserRouter has no built-in hook for this, so the caller prevents the link
 * and runs the navigation here. Browsers without the API just navigate.
 */

export interface ClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

/** A click that should navigate in place, not open a new tab or window. */
export function isPlainClick(e: ClickLike): boolean {
  return (
    e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented
  );
}

interface ViewTransitionLike {
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
}

/** The part of `document` this needs; tests pass a fake. */
export interface TransitionDoc {
  startViewTransition?: (update: () => Promise<void> | void) => ViewTransitionLike;
  querySelector: (selector: string) => Element | null;
  /** Carries `data-vt` (the kind) while a transition runs. */
  documentElement?: Element;
}

/** One element that morphs: `source` on the old page, the `dest` selector on the new one. */
export interface SharedElement {
  name: string;
  source: HTMLElement | null;
  dest: string;
}

export interface PageTransitionOptions {
  doc?: TransitionDoc;
  /** Navigate. Must render the new route synchronously (wrap it in `flushSync`). */
  update: () => void;
  /** Without the API, run this instead of `update` (e.g. a smooth scroll). Defaults to `update`. */
  fallback?: () => void;
  /** True once the new page is in the DOM; the snapshot of it waits for this. */
  ready: () => boolean;
  /** Runs once the new page is ready, before its snapshot (e.g. scroll to the target). */
  settle?: () => void;
  /** Set as `data-vt` on the root while it runs: CSS picks the page animation by it. */
  kind?: string;
  shared: SharedElement[];
  /** Cross-fade the pages only: nothing flies across the screen. */
  reducedMotion?: boolean;
  timeoutMs?: number;
}

const NAME = "viewTransitionName" as const;

function setName(el: Element | null, name: string): void {
  if (el instanceof HTMLElement) (el.style as unknown as Record<string, string>)[NAME] = name;
}

/** Resolves once `check()` is true, or after `timeoutMs` (the page then shows as it is). */
function waitFor(check: () => boolean, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (check() || Date.now() - start >= timeoutMs) resolve();
      else setTimeout(tick, 16);
    };
    tick();
  });
}

export async function runPageTransition({
  doc = document as unknown as TransitionDoc,
  update,
  fallback = update,
  ready,
  settle,
  kind,
  shared,
  reducedMotion = false,
  timeoutMs = 1000,
}: PageTransitionOptions): Promise<void> {
  if (typeof doc.startViewTransition !== "function") {
    fallback();
    return;
  }
  const root = doc.documentElement;
  if (kind) root?.setAttribute("data-vt", kind);
  const morphing = reducedMotion ? [] : shared;
  for (const s of morphing) setName(s.source, s.name);
  const dests: Element[] = [];

  const transition = doc.startViewTransition(async () => {
    update();
    // The route mounts after AnimatePresence lets the old one go: wait for it.
    await waitFor(ready, timeoutMs);
    settle?.();
    // On the same page the source is still there: only the destination may carry the name now.
    for (const s of morphing) setName(s.source, "");
    for (const s of morphing) {
      const dest = doc.querySelector(s.dest);
      if (!dest) continue;
      setName(dest, s.name);
      dests.push(dest);
    }
  });

  try {
    await transition.finished;
  } catch {
    // A skipped transition still navigated; nothing to undo.
  } finally {
    for (const s of morphing) setName(s.source, "");
    for (const d of dests) setName(d, "");
    if (kind) root?.removeAttribute("data-vt");
  }
}

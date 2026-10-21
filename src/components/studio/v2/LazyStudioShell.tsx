import { lazy, Suspense } from "react";

/** Fetches the Studio chunk; the home calls it when idle so it is ready early. */
export const loadStudioShell = () => import("./StudioShell");
const StudioShell = lazy(() => loadStudioShell().then((m) => ({ default: m.StudioShell })));

/**
 * The Studio as its own chunk. It sits below the fold, so the hero hydrates
 * without waiting for it; the prerendered HTML already shows it meanwhile.
 */
export function LazyStudioShell() {
  return (
    <Suspense fallback={null}>
      <StudioShell />
    </Suspense>
  );
}

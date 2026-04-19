import { useEffect, useRef, type DependencyList } from "react";
import { renderGradient, type RenderOpts } from "./gradient";

/**
 * Paint a gradient onto a `<canvas>` whenever its opts change.
 * Returns the ref to pass to the `<canvas>` element.
 *
 * Call sites: Preview, History cards, Gallery cards.
 * The `deps` parameter is explicit (not derived from `opts`) so callers can opt
 * out of re-render on identity-changing but value-stable references.
 */
export function useGradientCanvas(opts: RenderOpts, deps: DependencyList): React.RefObject<HTMLCanvasElement> {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    renderGradient(canvas, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

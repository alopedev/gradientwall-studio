import { useEffect, useState, type RefObject } from "react";

/**
 * Returns `true` once `ref`'s element crosses the viewport within `rootMargin`.
 * One-shot: disconnects the observer after the first intersection, so heavy
 * children can mount lazily without resubscribing on subsequent scrolls.
 */
export function useDeferUntilVisible(ref: RefObject<Element | null>, rootMargin = "200px"): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, visible]);
  return visible;
}

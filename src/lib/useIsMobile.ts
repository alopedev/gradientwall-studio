import { useEffect, useState } from "react";

/**
 * useIsMobile — boolean reactivo a la media query `(max-width: 639px)`.
 *
 * Usado por Studio v2 para coreografiar el layout del CustomizePanel:
 * - Desktop (≥640px): panel inline lateral, anim width 0→340.
 * - Mobile (<640px): panel apilado debajo del canvas, anim height 0→auto.
 *
 * Render inicial: false. El primer paint usa el layout desktop; en mobile,
 * el efecto detecta el cambio inmediatamente y triggea re-render — no hay
 * FOUC perceptible porque el panel arranca cerrado.
 *
 * SSR-safe: si `window` no está disponible (entornos de test sin jsdom o
 * SSR), devuelve false.
 */
export function useIsMobile(breakpoint = 639): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}

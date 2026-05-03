import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";

// Module-scoped ref so non-React code (or sibling effects mounted before
// the provider's effect runs) can still reach the live Lenis instance.
const LenisRefContext = createContext<{ current: Lenis | null }>({ current: null });

/** Returns the live Lenis instance, or null if reduced-motion or pre-mount. */
export function useLenis(): Lenis | null {
  return useContext(LenisRefContext).current;
}

// Smooth-scroll inertia provider. Mounts a single Lenis instance, drives
// rAF loop, tears down on unmount. Honors prefers-reduced-motion (skips
// entirely — no Lenis instance, no listeners — so reduced-motion users
// get the browser's native scroll behavior).
//
// We also intercept in-page hash navigations so anchor links (`/#packs`)
// glide instead of jumping. Cross-route hash navigation is handled in
// `App.tsx` via `useLocation`; that path bypasses Lenis since we want a
// snap on route change, not a slide.
export function LenisProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    ref.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const onHashClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0 });
      history.replaceState(null, "", href);
    };
    document.addEventListener("click", onHashClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", onHashClick);
      lenis.destroy();
      ref.current = null;
    };
  }, []);

  return <LenisRefContext.Provider value={ref}>{children}</LenisRefContext.Provider>;
}

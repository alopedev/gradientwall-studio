import { useEffect, type ReactNode } from "react";
import Lenis from "@studio-freight/lenis";

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
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

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
    };
  }, []);

  return <>{children}</>;
}

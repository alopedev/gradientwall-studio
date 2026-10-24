import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scroll to the hash target on mount or when navigation lands here with a
 * fragment (e.g. /#packs from the pack page back-link, or a gallery link to a
 * landing's #studio). Without this, hash anchors only work for in-page clicks,
 * not cross-route navigations. The Studio is its own chunk, so `#studio` may
 * mount a few frames late: keep looking for up to ~2 s.
 */
export function useScrollToHash(): void {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let raf = 0;
    let tries = 120;
    const find = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
      else if (tries-- > 0) raf = requestAnimationFrame(find);
    };
    raf = requestAnimationFrame(find);
    return () => cancelAnimationFrame(raf);
  }, [hash]);
}

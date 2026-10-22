import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Link, type LinkProps, useLocation, useNavigate } from "react-router-dom";
import { prefersReducedMotion } from "@/lib/motion";
import { isPlainClick, runPageTransition } from "@/lib/page-transition";
import { useLenisRef } from "./LenisProvider";

interface Props extends Omit<LinkProps, "to"> {
  to: string;
}

/**
 * A link to another page that cross-fades into it (a view transition; the
 * nav stays put) instead of swapping in one frame. A link to the page already
 * open glides back to its top. Browsers without the API just navigate.
 */
export function PageLink({ to, onClick, ...rest }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lenisRef = useLenisRef();

  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (!isPlainClick(e)) return;
    if (samePath(to, pathname)) {
      e.preventDefault();
      const lenis = lenisRef.current;
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      return;
    }
    const doc = document as Document & { startViewTransition?: unknown };
    if (typeof doc.startViewTransition !== "function") return;
    e.preventDefault();
    // Every page has an h1: the new page is in once a different one is.
    const oldHeading = document.querySelector("h1");
    void runPageTransition({
      update: () => flushSync(() => navigate(to)),
      ready: () => {
        const heading = document.querySelector("h1");
        return heading !== null && heading !== oldHeading;
      },
      reducedMotion: prefersReducedMotion(),
      shared: [],
    });
  };

  return <Link {...rest} to={to} onClick={go} />;
}

/** `/privacy/` and `/privacy` are the same page. */
function samePath(a: string, b: string): boolean {
  const strip = (p: string) => p.replace(/\/+$/, "") || "/";
  return !a.includes("#") && strip(a) === strip(b);
}

import type Lenis from "lenis";
import { type AnchorHTMLAttributes, type MouseEvent, useCallback } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { prefersReducedMotion } from "@/lib/motion";
import { isPlainClick, runPageTransition, type SharedElement } from "@/lib/page-transition";
import { onScreen, scrollKind } from "@/lib/section-nav";
import { useLenisRef } from "./LenisProvider";

export type Section = "studio" | "packs";

/** The Studio's screen, where a wallpaper on its way to the Studio lands. */
export const STUDIO_SCREEN = "[data-vt=studio-screen]";
/** The Studio frame, focused on arrival so Space and the keys work straight away. */
const STUDIO_FRAME = "[data-studio-frame]";

/**
 * Where the wallpaper that flies to the Studio starts: the link's own preview
 * (`data-vt-src` inside it or inside its `data-vt-scope` card, e.g. the nav's
 * "Your own" swatch), else the hero phone. Only one on screen may fly; one off
 * screen would cross the page.
 */
function studioSource(link: HTMLElement): HTMLElement | null {
  const scope = link.closest("[data-vt-scope]") ?? link;
  const candidates = [
    scope.querySelector<HTMLElement>("[data-vt-src]"),
    document.querySelector<HTMLElement>("[data-vt-src=hero-screen]"),
  ];
  return (
    candidates.find((el) => el && onScreen(el.getBoundingClientRect(), window.innerHeight)) ?? null
  );
}

function scrollMargin(el: HTMLElement): number {
  return Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
}

/** Straight to the section, no animation (the view transition animates it). */
function jump(el: HTMLElement, lenis: Lenis | null): void {
  if (lenis) lenis.scrollTo(el, { offset: -scrollMargin(el), immediate: true, force: true });
  else el.scrollIntoView({ block: "start", behavior: "instant" });
}

/** A smooth scroll to the section: where view transitions are missing, and for short trips. */
function glide(el: HTMLElement, lenis: Lenis | null): void {
  if (lenis) lenis.scrollTo(el, { offset: -scrollMargin(el) });
  else el.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

function focusStudio(): void {
  document.querySelector<HTMLElement>(STUDIO_FRAME)?.focus({ preventScroll: true });
}

/**
 * Follow a link to a section without the browser's instant jump. To the
 * Studio, the page moves as one sheet (up or down, `data-vt=scroll-*`) while
 * the wallpaper in view flies into the Studio's screen; other sections glide
 * there. On a page without that section, the home opens with a cross-fade and
 * lands on it. `shared` adds elements that morph on the way (the pack page's
 * phone flying back into its card).
 */
export function useGoToSection() {
  const navigate = useNavigate();
  const lenisRef = useLenisRef();

  return useCallback(
    (e: MouseEvent<HTMLAnchorElement>, id: Section, shared: SharedElement[] = []) => {
      if (!isPlainClick(e)) return;
      e.preventDefault();
      const lenis = lenisRef.current;
      const reducedMotion = prefersReducedMotion();
      const studio = id === "studio";
      const morph = (
        studio
          ? [{ name: "studio-screen", source: studioSource(e.currentTarget), dest: STUDIO_SCREEN }]
          : shared
      ).filter((s) => s.source);
      const arrive = () => {
        if (studio) focusStudio();
      };

      const here = document.getElementById(id);
      if (here) {
        history.replaceState(history.state, "", `#${id}`);
        if (!studio) {
          glide(here, lenis);
          return;
        }
        void runPageTransition({
          kind: reducedMotion ? undefined : scrollKind(here.getBoundingClientRect().top),
          update: () => jump(here, lenis),
          fallback: () => glide(here, lenis),
          ready: () => true,
          reducedMotion,
          shared: morph,
        }).then(arrive);
        return;
      }

      void runPageTransition({
        update: () => flushSync(() => navigate(`/#${id}`)),
        // The Studio is its own chunk: give it a little longer to arrive.
        ready: () => document.getElementById(id) !== null,
        settle: () => {
          const el = document.getElementById(id);
          if (el) jump(el, lenisRef.current);
        },
        reducedMotion,
        shared: morph,
        timeoutMs: 1500,
      }).then(arrive);
    },
    [navigate, lenisRef],
  );
}

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: Section;
  /** Elements that morph on the way (built at click time, when they are on the page). */
  shared?: () => SharedElement[];
}

/** A link to a home section (`/#studio`, `/#packs`) that animates the trip; see `useGoToSection`. */
export function SectionLink({ to, shared, onClick, ...rest }: Props) {
  const go = useGoToSection();
  return (
    <a
      {...rest}
      href={`/#${to}`}
      onClick={(e) => {
        onClick?.(e);
        go(e, to, shared?.());
      }}
    />
  );
}
